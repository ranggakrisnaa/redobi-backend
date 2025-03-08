import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPublic } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import {
  Body,
  Controller,
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
import { CreateStudentDto } from './dto/create.req.dto';
import { StudentPaginationReqQuery } from './dto/query.req.dto';
import { UpdateStudentDto } from './dto/update.req.dto';
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

  @ApiPublic({
    type: UpdateStudentDto,
    summary: 'Update Student',
  })
  @Put(':userId')
  @UseInterceptors(FileInterceptor('file', new UploadService().multerOptions))
  async Update(
    @Body() req: UpdateStudentDto,
    @Param('userId', ParseUUIDPipe) userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IStudent> {
    return await this.studentService.Update(req, userId, file);
  }

  @ApiPublic({
    summary: 'Generate Template Excel',
  })
  @Get('templates')
  async generateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.studentService.generateTemplateExcel();

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');

    res.send(bufferFile);
  }

  @ApiPublic({
    summary: 'Handle Excel Template',
  })
  @Post('templates')
  @UseInterceptors(FileInterceptor('file', new UploadService().multerOptions))
  async handleExcelTemplate(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IStudent[]> {
    return await this.studentService.handleExcelTemplate(file);
  }
}
