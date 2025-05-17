import { RefreshReqDto } from '@/api/auth/dto/refresh.dto';
import { RegisterDto } from '@/api/auth/dto/register.dto';
import { ResendOtpDto } from '@/api/auth/dto/resend-otp.dto';
import { UserRepository } from '@/api/user/user.repository';
import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Token, Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { SessionEntity } from '@/database/entities/session.entity';
import { OtpTrialStatus } from '@/database/enums/otp-trial-status.enum';
import { ISession } from '@/database/interface-model/session-entity.interface';
import { IUser } from '@/database/interface-model/user-entity.interface';
import { hashPassword, verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import ms from 'ms';
import { DataSource } from 'typeorm';
import { SessionRepository } from '../session/session.repository';
import { LoginReqDto } from './dto/login.dto';
import { LogoutResDto } from './dto/logout.dto.res';
import { VerifyLoginReqDto } from './dto/verify-login.dto';
import { SignInResponse } from './types/sign-in-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
  ) {}

  async SignUp(reqBody: LoginReqDto): Promise<Record<string, Partial<IUser>>> {
    const foundUser = await this.userRepository.findOneBy({
      email: reqBody.email,
    });
    if (foundUser) {
      throw new ConflictException('User already exist');
    }

    try {
      const user = await this.userRepository.save({
        ...reqBody,
        password: await hashPassword(reqBody.password),
        imageUrl: DEFAULT.IMAGE_DEFAULT,
      });

      return { data: RegisterDto.toResponse(user) };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async SignIn(reqBody: LoginReqDto): Promise<Record<string, SignInResponse>> {
    const foundUser = await this.userRepository.findOneBy({
      email: reqBody.email,
    });
    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid =
      foundUser && (await verifyPassword(reqBody.password, foundUser.password));
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password not valid');
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
          accessToken: INITIAL_VALUE.STRING,
        });
      }

      // TODO: change to otp safe package
      const otpCode = Math.floor(100000 + Math.random() * 900000);

      await this.sessionRepository.UpdateSessionByUserIDWithTransaction(
        queryRunner,
        foundUser.id,
        {
          otpCode,
          validOtpUntil: new Date(Date.now() + 10 * 60 * 1000),
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

      return { data: { id: foundUser.id, otpCode, email: foundUser.email } };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async VerifySignIn(
    reqBody: VerifyLoginReqDto,
  ): Promise<Record<string, Token>> {
    const foundSession = await this.sessionRepository.findOne({
      where: { userId: reqBody.userId as Uuid },
    });

    try {
      await this.verifyOTP(foundSession, reqBody.otpCode);

      const token = await this.createToken({
        id: foundSession.userId,
        sessionId: foundSession.id,
        hash: foundSession.refreshToken,
      });

      await this.sessionRepository.update(foundSession.id, {
        otpTrial: 0,
        isLimit: false,
        updatedAt: new Date(),
        refreshToken: token.refreshToken,
        accessToken: token.accessToken,
      });

      return { data: token };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async resetLockAccount(userId: Uuid): Promise<void> {
    const foundSession = await this.sessionRepository.findOne({
      where: { userId: userId },
    });

    if (!foundSession) {
      throw new NotFoundException('Session not found');
    }

    const newOtpCode = Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const validUntil = new Date(now.getTime() + 5 * 60 * 1000); // OTP valid 5 menit

    await this.sessionRepository.update(foundSession.id, {
      otpTrial: 0,
      isLimit: false,
      lockedUntil: null,
      otpCode: newOtpCode,
      validOtpUntil: validUntil,
      updatedAt: now,
    });
  }

  async verifyOTP(foundSession: ISession, otpCode: number) {
    const now = new Date();

    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }

    if (
      foundSession.isLimit &&
      foundSession.lockedUntil &&
      foundSession.lockedUntil < now
    ) {
      await this.resetLockAccount(foundSession.userId);
      throw new UnauthorizedException(
        'Account has been unlocked. Please check your new OTP',
      );
    }

    if (foundSession.isLimit) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    if (foundSession.validOtpUntil < now) {
      throw new UnauthorizedException('OTP expired');
    }

    const sessionOtp = Number(foundSession.otpCode);
    const inputOtp = Number(otpCode);

    if (sessionOtp !== inputOtp) {
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

    return true;
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

  async RefreshToken(req: RefreshReqDto): Promise<Record<string, Token>> {
    const verifyToken = await this.jwtService.verifyAsync(req.refreshToken, {
      secret: this.configService.getOrThrow('auth.refreshSecret', {
        infer: true,
      }),
    });

    const foundSession = await this.sessionRepository.findOneBy({
      id: verifyToken.sessionId,
    });
    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }

    const token = await this.createToken({
      id: foundSession.userId,
      sessionId: foundSession.id,
      hash: foundSession.refreshToken,
    });

    await this.sessionRepository.update(foundSession.id, {
      refreshToken: token.refreshToken,
      accessToken: token.accessToken,
    });

    return { data: token };
  }

  async ResendOTP(req: ResendOtpDto): Promise<Record<string, any>> {
    const [foundUser, foundSession] = await Promise.all([
      this.userRepository.findOne({
        where: {
          email: req.email,
          id: req.userId as Uuid,
        },
      }),
      this.sessionRepository.findOneBy({ userId: req.userId as Uuid }),
    ]);

    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }

    // TODO: change to otp safe package
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    try {
      await this.sessionRepository.update(foundSession.id, {
        otpCode,
        validOtpUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      await this.emailQueue.add(
        JobName.EMAIL_VERIFICATION,
        {
          email: foundUser.email,
          otpCode,
        } as IVerifyEmailJob,
        { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
      );

      return { data: { id: foundUser.id as Uuid, otpCode } };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Logout(userId: string): Promise<Record<string, ISession>> {
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
      return { data: LogoutResDto.toPlainLogout(foundSession) as ISession };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }
}
