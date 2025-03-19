import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Token, Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { INITIAL_VALUE } from '@/constants/app.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { SessionEntity } from '@/database/entities/session.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { OtpTrialStatus } from '@/database/enums/otp-trial-status.enum';
import { ISession } from '@/database/interface-model/session-entity.interface';
import { verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import ms from 'ms';
import { DataSource, Repository } from 'typeorm';
import { SessionRepository } from '../session/session.repository';
import { LoginReqDto } from './dto/login.dto';
import { LogoutResDto } from './dto/logout.res';
import { VerifyLoginReqDto } from './dto/verify-login.dto';
import { SignInResponse } from './types/sign-in-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly sessionRepository: SessionRepository,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
  ) {}

  async SignIn(reqBody: LoginReqDto): Promise<SignInResponse> {
    const foundUser = await this.userRepository.findOneBy({
      email: reqBody.email,
    });
    if (!foundUser) {
      throw new UnauthorizedException('User is not found.');
    }

    const isPasswordValid =
      foundUser && (await verifyPassword(reqBody.password, foundUser.password));
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is not valid.');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    const foundSession = await this.sessionRepository.findOneBy({
      userId: foundUser.id,
    });

    try {
      if (!foundSession) {
        await queryRunner.manager.insert(SessionEntity, {
          userId: foundUser.id,
          refreshToken: INITIAL_VALUE.STRING,
          isLimit: INITIAL_VALUE.FALSE,
          otpCode: INITIAL_VALUE.NUMBER,
          otpTrial: INITIAL_VALUE.NUMBER,
        });
      }
      const otpCode = Math.floor(100000 + Math.random() * 900000);

      await this.sessionRepository.UpdateSessionByUserIDWithTransaction(
        queryRunner,
        foundUser.id,
        {
          otpCode,
        },
      );

      await queryRunner.commitTransaction();
      await this.emailQueue.add(
        JobName.EMAIL_VERIFICATION,
        {
          email: foundUser.email,
          otpCode,
        } as IVerifyEmailJob,
        { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
      );

      return { id: foundUser.id, otpCode };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async VerifySignIn(reqBody: VerifyLoginReqDto): Promise<Token> {
    const now = new Date();

    const foundSession = await this.sessionRepository.findOne({
      where: { userId: reqBody.userId as Uuid },
    });

    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }

    if (foundSession.isLimit) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    if (foundSession.otpCode !== reqBody.otpCode) {
      const updatedTrialCount = foundSession.otpTrial + 1;
      const lastAttemptDiff = this.getMinutesSinceLastAttempt(
        foundSession.updatedAt,
        now,
      );

      if (updatedTrialCount >= OtpTrialStatus.MAX_TRIALS) {
        await this.lockAccount(foundSession.id);
        throw new UnauthorizedException('Maximum OTP attempts exceeded');
      }

      if (
        updatedTrialCount > OtpTrialStatus.FIRST_RETRY &&
        lastAttemptDiff < 1
      ) {
        throw new UnauthorizedException('Please wait before retrying');
      }

      await this.sessionRepository.update(foundSession.id, {
        otpTrial: updatedTrialCount,
        updatedAt: now,
      });

      throw new UnauthorizedException('Invalid OTP');
    }

    try {
      const token = await this.createToken({
        id: reqBody.userId,
        sessionId: foundSession.id,
        hash: foundSession.refreshToken,
      });

      await this.sessionRepository.update(foundSession.id, {
        otpTrial: 0,
        isLimit: false,
        updatedAt: now,
        refreshToken: token.refreshToken,
      });

      return token;
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  private getMinutesSinceLastAttempt(
    lastAttempt: Date,
    currentTime: Date,
  ): number {
    return (currentTime.getTime() - lastAttempt.getTime()) / (1000 * 60);
  }

  private async lockAccount(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      isLimit: true,
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
    });
  }

  private async createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenExpires,
    } as Token;
  }

  async Logout(userId: string): Promise<Partial<ISession>> {
    const foundSession = await this.sessionRepository.findOneBy({
      userId: userId as Uuid,
    });
    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }
    try {
      await this.sessionRepository.update(foundSession.id, {
        refreshToken: INITIAL_VALUE.STRING,
      });
      return LogoutResDto.toPlainLogout(foundSession);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }
}
