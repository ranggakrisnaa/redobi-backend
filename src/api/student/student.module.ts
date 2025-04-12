import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { SessionEntity } from '@/database/entities/session.entity';
import { StudentEntity } from '@/database/entities/student.entity';
import { AwsService } from '@/libs/aws/aws.service';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { SessionRepository } from '../session/session.repository';
import { StudentController } from './student.controller';
import { StudentRepository } from './student.repository';
import { StudentService } from './student.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity, SessionEntity])],
  controllers: [StudentController],
  providers: [
    StudentService,
    StudentRepository,
    ExcelJsService,
    OffsetPaginatedDto,
    SessionRepository,
    JwtService,
    AwsService,
  ],
})
export class StudentModule {}
