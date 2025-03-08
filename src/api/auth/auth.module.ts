import { SessionEntity } from '@/database/entities/session.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionRepository } from '../session/session.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository],
})
export class AuthModule {}
