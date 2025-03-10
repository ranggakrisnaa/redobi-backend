import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { AuthService } from '../auth/auth.service';
import { SessionRepository } from '../session/session.repository';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LecturerEntity, SessionEntity, UserEntity]),
  ],
  controllers: [LecturerController],
  providers: [
    LecturerService,
    ExcelJsService,
    OffsetPaginatedDto,
    AuthService,
    JwtService,
    SessionRepository,
  ],
})
export class LecturerModule {}
