import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
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
import { MulterService } from '../../multer/multer.service';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { CreateStudentDto } from './dto/create.dto';
import { DeleteStudentDto } from './dto/delete.dto';
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

  @ApiAuth({
    summary: 'Pagination Student',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: StudentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IStudent>> {
    return await this.studentService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Generate Template Excel',
  })
  @Get('templates')
  async GenerateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.studentService.GenerateTemplateExcel();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=template_mahasiswa.xlsx',
      'Content-Length': Buffer.byteLength(bufferFile),
    });
    res.send(bufferFile);
  }

  @ApiAuth({
    summary: 'Get Student By Id',
  })
  @Get(':studentId')
  async Detail(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<IStudent> {
    return await this.studentService.Detail(studentId);
  }

  @ApiAuth({
    type: CreateStudentDto,
    summary: 'Create Student',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerImageOptions),
  )
  async Create(
    @Body() req: CreateStudentDto,
    @CurrentUser() userToken: JwtPayloadType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<IStudent>> {
    return await this.studentService.Create(req, userToken.id, file);
  }

  @ApiAuth({
    type: UpdateStudentDto,
    summary: 'Update Student',
  })
  @Put(':studentId')
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerImageOptions),
  )
  async Update(
    @Body() req: UpdateStudentDto,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<IStudent>> {
    return await this.studentService.Update(req, studentId, file);
  }

  @ApiAuth({
    summary: 'Delete Student',
    type: DeleteStudentDto,
  })
  @Delete(':studentId?')
  async Delete(
    @Param('studentId') studentId: string,
    @Body() req: DeleteStudentDto,
  ): Promise<Partial<IStudent> | Partial<IStudent>[]> {
    return await this.studentService.Delete(studentId, req);
  }

  @ApiAuth({
    summary: 'Handle Excel Template',
  })
  @Post('templates')
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerExcelOptions),
  )
  async HandleExcelTemplate(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userToken: JwtPayloadType,
  ): Promise<IStudent[]> {
    return await this.studentService.HandleExcelTemplate(file, userToken.id);
  }
}
