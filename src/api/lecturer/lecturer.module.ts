import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { AwsService } from '@/libs/aws/aws.service';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { SessionRepository } from '../session/session.repository';
import { LecturerController } from './lecturer.controller';
import { LecturerRepository } from './lecturer.repository';
import { LecturerService } from './lecturer.service';

@Module({
  imports: [TypeOrmModule.forFeature([LecturerEntity, SessionEntity])],
  controllers: [LecturerController],
  providers: [
    LecturerService,
    ExcelJsService,
    OffsetPaginatedDto,
    JwtService,
    SessionRepository,
    LecturerRepository,
    AwsService,
  ],
})
export class LecturerModule {}
