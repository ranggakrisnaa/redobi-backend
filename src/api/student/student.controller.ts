import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { CreateStudentDto } from './dto/create.req.dto';
import { StudentPaginationReqQuery } from './dto/query.req.dto';
import { StudentService } from './student.service';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @ApiPublic({
    summary: 'Pagination Student',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: StudentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IStudent>> {
    return await this.studentService.Pagination(reqQuery);
  }

  @ApiPublic({
    type: CreateStudentDto,
    summary: 'Create Student',
  })
  @Post()
  @UseInterceptors(FileInterceptor('file', new UploadService().multerOptions))
  async Create(
    @Body() req: CreateStudentDto,
    @CurrentUser() userToken: JwtPayloadType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IStudent> {
    return await this.studentService.Create(req, userToken.id, file);
  }
}
