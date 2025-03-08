<<<<<<< HEAD
import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
=======
import { SessionEntity } from '@/database/entities/session.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionRepository } from '../session/session.repository';
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
<<<<<<< HEAD
    UserModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({}),
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.AUTH,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
=======
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository],
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f
})
export class AuthModule {}
