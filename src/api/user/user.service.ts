import { AuthService } from '@/api/auth/auth.service';
import { SessionRepository } from '@/api/session/session.repository';
import { RequestPasswordDto } from '@/api/user/dto/request-password.dto';
import { UpdateEmailDto } from '@/api/user/dto/update-email.dto';
import { UpdatePasswordDto } from '@/api/user/dto/update-password.dto';
import { UpdateUserDto } from '@/api/user/dto/update.dto';
import { VerifyOtpDto } from '@/api/user/dto/verify-otp.dto';
import { UserRepository } from '@/api/user/user.repository';
import { IEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT } from '@/constants/app.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { IUser } from '@/database/interface-model/user-entity.interface';
import { AwsService } from '@/libs/aws/aws.service';
import { hashPassword, verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class UserService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
    private readonly authService: AuthService,
    private readonly awsService: AwsService,
  ) {}

  async Detail(userId: string): Promise<IUser> {
    const foundUser = await this.userRepository.findOneBy({
      id: userId as Uuid,
    });
    if (!foundUser) {
      throw new NotFoundException('User is not founds.');
    }

    return foundUser;
  }

  async Update(req: UpdateUserDto, userId: string, file: Express.Multer.File) {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundUser = await this.userRepository.findOneBy({
      id: userId as Uuid,
    });
    if (!foundUser) {
      throw new NotFoundException('User is not found.');
    }

    if (file) {
      imageUrl = await this.awsService.uploadFile(file);
    }

    try {
      const data = await this.userRepository.save({
        ...req,
        ...foundUser,
        imageUrl,
      });

      return UpdateUserDto.toPlainUser(data);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  async UpdatePassword(
    req: UpdatePasswordDto,
    userId: string,
  ): Promise<Partial<IUser>> {
    const foundUser = await this.userRepository.findOneBy({
      id: userId as Uuid,
    });
    if (!foundUser) {
      throw new NotFoundException('User is not found.');
    }

    const matchPassword = await verifyPassword(
      req.oldPassword,
      foundUser.password,
    );
    if (!matchPassword) {
      throw new BadRequestException('Old password is not valid.');
    }

    if (req.newPassword !== req.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password is not match.',
      );
    }

    try {
      const data = await this.userRepository.save({
        ...foundUser,
        password: await hashPassword(req.newPassword),
      });

      return UpdateUserDto.toPlainUser(data);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  async RequestUpdateEmailAndPassword(req: RequestPasswordDto) {
    const foundUser = await this.userRepository.findOneBy({ email: req.email });
    if (!foundUser) {
      throw new Error('User is not found.');
    }

    // TODO: change to otp safe package
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    try {
      await this.sessionRepository.update(foundUser.id, {
        otpCode,
        validOtpUntil: new Date(Date.now() + 10 * 60 * 1000),
      });
      await this.emailQueue.add(
        JobName.PASSWORD_RESET_VERIFICATION,
        {
          email: foundUser.email,
          otpCode,
        } as IVerifyEmailJob,
        { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
      );

      return {
        email: foundUser.email,
        otpCode,
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  async UpdateEmail(req: UpdateEmailDto, userId: string) {
    const foundUser = await this.userRepository.findOneBy({
      id: userId as Uuid,
    });
    if (!foundUser) {
      throw new NotFoundException('User is not found.');
    }

    const matchPassword = await verifyPassword(
      req.password,
      foundUser.password,
    );
    if (!matchPassword) {
      throw new BadRequestException('Old password is not valid.');
    }

    if (req.password !== req.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password is not match.',
      );
    }

    try {
      const data = await this.userRepository.save({
        ...foundUser,
        email: req.email,
      });

      return UpdateUserDto.toPlainUser(data);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  async VerifyOtp(req: VerifyOtpDto): Promise<Partial<IUser>> {
    const foundUser = await this.userRepository.findOneBy({ email: req.email });
    if (!foundUser) {
      throw new Error('User is not found.');
    }

    const foundSession = await this.sessionRepository.findOne({
      where: { userId: foundUser.id },
    });

    await this.authService.verifyOTP(
      foundSession,
      req.otp as unknown as number,
    );

    await this.sessionRepository.update(foundSession.id, {
      otpTrial: 0,
      isLimit: false,
      updatedAt: new Date(),
    });

    return {
      id: foundUser.id,
    };
  }
}
