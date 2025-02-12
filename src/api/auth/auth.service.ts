import { INITIAL_VALUE } from '@/common/constant/nullable.constant';
import { UserEntity } from '@/common/entities/user.entity';
import { OtpTrialStatus } from '@/common/enums/otp-trial-status.enum';
import { IEmailJob } from '@/common/interfaces/job.interface';
import { AllConfigType } from '@/config/config.type';
import { QueueName } from '@/constants/job.constant';
import { verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import ms from 'ms';
import { DataSource, Repository } from 'typeorm';
import { Token, Uuid } from '../../common/types/common.type';
import { SessionRepository } from '../session/session.repository';
import { LoginReqDto } from './dto/login.req.dto';
import { VerifyLoginReqDto } from './dto/verify-login.req.dto';
import { JwtPayloadType } from './types/jwt-payload.type';
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
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async signIn(reqBody: LoginReqDto): Promise<SignInResponse> {
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
    if (!foundSession) {
      await this.sessionRepository.insert({
        userId: foundUser.id,
        hashToken: INITIAL_VALUE.STRING,
        isLimit: INITIAL_VALUE.FALSE,
        otpCode: INITIAL_VALUE.NUMBER,
        otpTrial: INITIAL_VALUE.NUMBER,
      });
    }
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000);

      await this.sessionRepository.UpdateSessionByUserIDWithTransaction(
        queryRunner,
        foundUser.id,
        {
          otpCode,
        },
      );

      await queryRunner.commitTransaction();

      return { id: foundUser.id, otpCode };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      if (err instanceof Error) throw err.message;
    } finally {
      await queryRunner.release();
    }
  }

  async verifySignIn(reqBody: VerifyLoginReqDto): Promise<Token> {
    const now = new Date();

    // Find existing session
    const foundSession = await this.sessionRepository.findOne({
      where: {
        userId: reqBody.userId as Uuid,
      },
    });

    if (!foundSession) {
      throw new UnauthorizedException('Session not found');
    }

    // Check if account is locked
    if (foundSession.isLimit) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    // OTP verification
    if (foundSession.otpCode !== reqBody.otpCode) {
      // Increment trial count
      const updatedTrialCount = foundSession.otpTrial + 1;

      // Check time since last attempt
      const lastAttemptDiff = this.getMinutesSinceLastAttempt(
        foundSession.updatedAt,
        now,
      );

      // Implement trial logic
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

      // Update trial count
      await this.sessionRepository.update(foundSession.id, {
        otpTrial: updatedTrialCount,
        updatedAt: now,
      });

      throw new UnauthorizedException('Invalid OTP');
    }

    // Generate authentication token
    const token = await this.createToken({
      id: reqBody.userId,
      sessionId: foundSession.id,
      hash: foundSession.hashToken,
    });

    // Reset trial count on successful verification
    await this.sessionRepository.update(foundSession.id, {
      otpTrial: 0,
      isLimit: false,
      updatedAt: now,
      hashToken: token.accessToken,
    });

    return token;
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

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException();
    }
    return payload;
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
          hash: data.hash,
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
}
