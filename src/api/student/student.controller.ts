import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPublic } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from 'src/upload/upload.service';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { CreateStudentDto } from './dto/create.dto';
import { StudentPaginationReqQuery } from './dto/query.req.dto';
import { UpdateStudentDto } from './dto/update.dto';
import { StudentService } from './student.service';

@ApiTags('students')
@Controller({
  path: 'students',
  version: '1',
})
@UseGuards(AuthGuard)
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
    summary: 'Get Student By Id',
  })
  @Get(':studentId')
  async Detail(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<IStudent> {
    return await this.studentService.Detail(studentId);
  }

  @ApiPublic({
    type: CreateStudentDto,
    summary: 'Create Student',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', new UploadService().multerImageOptions),
  )
  async Create(
    @Body() req: CreateStudentDto,
    @CurrentUser() userToken: JwtPayloadType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<IStudent>> {
    return await this.studentService.Create(req, userToken.id, file);
  }

  @ApiPublic({
    type: UpdateStudentDto,
    summary: 'Update Student',
  })
  @Put(':studentId')
  @UseInterceptors(
    FileInterceptor('file', new UploadService().multerImageOptions),
  )
  async Update(
    @Body() req: UpdateStudentDto,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<IStudent>> {
    return await this.studentService.Update(req, studentId, file);
  }

  @ApiPublic({
    summary: 'Delete Student',
  })
  @Delete(':studentId')
  async Delete(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<Partial<IStudent>> {
    return await this.studentService.Delete(studentId);
  }

  @ApiPublic({
    summary: 'Generate Template Excel',
  })
  @Get('templates')
  async GenerateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.studentService.GenerateTemplateExcel();

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
    res.send(bufferFile);
  }

  @ApiPublic({
    summary: 'Handle Excel Template',
  })
  @Post('templates')
  @UseInterceptors(
    FileInterceptor('file', new UploadService().multerExcelOptions),
  )
  async HandleExcelTemplate(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userToken: JwtPayloadType,
  ): Promise<IStudent[]> {
    return await this.studentService.HandleExcelTemplate(file, userToken.id);
  }
}
