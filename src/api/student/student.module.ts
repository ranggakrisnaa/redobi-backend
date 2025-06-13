import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { SessionEntity } from '@/database/entities/session.entity';
import { StorageUrlEntity } from '@/database/entities/storage-url.entity';
import { StudentEntity } from '@/database/entities/student.entity';
import { SupabaseService } from '@/libs/supabase/supabase.service';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { SessionRepository } from '../session/session.repository';
import { StorageUrlRepository } from '../storage-url/storage-url.repository';
import { StudentController } from './student.controller';
import { StudentRepository } from './student.repository';
import { StudentService } from './student.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, SessionEntity, StorageUrlEntity]),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    StudentRepository,
    ExcelJsService,
    OffsetPaginatedDto,
    SessionRepository,
    JwtService,
    SupabaseService,
    StorageUrlRepository,
  ],
})
export class StudentModule {}
