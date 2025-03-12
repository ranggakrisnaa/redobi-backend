import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
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
import { CreateLecturerDto } from './dto/create.dto';
import { DeleteLecturerDto } from './dto/delete.dto';
import { LecturerPaginationReqQuery } from './dto/query.dto';
import { UpdateLecturerDto } from './dto/update.dto';
import { LecturerService } from './lecturer.service';

@ApiTags('lecturers')
@Controller({
  path: 'lecturers',
  version: '1',
})
@UseGuards(AuthGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @ApiPublic({
    summary: 'Generate Template Excel',
  })
  @Get('templates')
  async GenerateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.lecturerService.GenerateTemplateExcel();

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_dosen-pembimbing.xlsx',
    );
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
  ): Promise<ILecturer[]> {
    return await this.lecturerService.HandleExcelTemplate(file, userToken.id);
  }

  @ApiPublic({
    summary: 'Create lecturer',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', new UploadService().multerImageOptions),
  )
  async Create(
    @Body() req: CreateLecturerDto,
    @CurrentUser() userToken: JwtPayloadType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    return await this.lecturerService.Create(req, userToken.id, file);
  }

  @ApiPublic({
    summary: 'Update lecturer',
  })
  @Put(':lecturerId')
  @UseInterceptors(
    FileInterceptor('file', new UploadService().multerImageOptions),
  )
  async Update(
    @Body() req: UpdateLecturerDto,
    @Param('lectuurerId', ParseUUIDPipe) lecturerId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    return await this.lecturerService.Update(req, lecturerId, file);
  }

  @ApiPublic({
    summary: 'Pagination lecturer',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    return await this.lecturerService.Pagination(reqQuery);
  }

  @ApiPublic({
    summary: 'Detail lecturer',
  })
  @Get(':lecturerId')
  async Detail(
    @Param('lecturerId', ParseUUIDPipe) lecturerId: string,
  ): Promise<ILecturer> {
    return await this.lecturerService.Detail(lecturerId);
  }

  @ApiPublic({
    summary: 'Delete lecturer',
  })
  @Delete(':lecturerId')
  async Delete(
    @Param('lecturerId') lecturerId: string,
    @Body() req: DeleteLecturerDto,
  ): Promise<Partial<ILecturer> | Partial<ILecturer>[]> {
    return await this.lecturerService.Delete(lecturerId, req);
  }
}
