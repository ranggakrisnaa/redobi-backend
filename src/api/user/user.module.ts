import { AuthService } from '@/api/auth/auth.service';
import { SessionRepository } from '@/api/session/session.repository';
import { UserRepository } from '@/api/user/user.repository';
import { QueueName, QueuePrefix } from '@/constants/job.constant';
import { SessionEntity } from '@/database/entities/session.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { AwsService } from '@/libs/aws/aws.service';
import { SupabaseService } from '@/libs/supabase/supabase.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity, UserEntity]),
    BullModule.registerQueue({
      name: QueueName.EMAIL,
      prefix: QueuePrefix.USER,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    SessionRepository,
    JwtService,
    UserRepository,
    AuthService,
    AwsService,
    SupabaseService,
  ],
})
export class UserModule {}
