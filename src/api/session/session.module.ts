import { SessionEntity } from '@/database/entities/session.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionRepository } from './session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  controllers: [],
  providers: [SessionRepository],
})
export class SessionModule {}
