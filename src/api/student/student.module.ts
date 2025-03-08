import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { SessionEntity } from '@/database/entities/session.entity';
import { StudentEntity } from '@/database/entities/student.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { AuthService } from '../auth/auth.service';
import { SessionRepository } from '../session/session.repository';
import { StudentController } from './student.controller';
import { StudentRepository } from './student.repository';
import { StudentService } from './student.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, SessionEntity, UserEntity]),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    StudentRepository,
    ExcelJsService,
    OffsetPaginatedDto,
    AuthService,
    JwtService,
    SessionRepository,
  ],
})
export class StudentModule {}
