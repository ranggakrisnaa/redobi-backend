import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPublic } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from 'src/upload/upload.service';
import { JwtPayloadType } from '../auth/types/jwt-payload.type';
import { LecturerService } from './lecturer.service';

@Controller('lecturer')
@UseGuards(AuthGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @ApiPublic({
    summary: 'Generate Template Excel',
  })
  @Get()
  async GenerateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.lecturerService.GenerateTemplateExcel();

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
  ): Promise<ILecturer[]> {
    return await this.lecturerService.HandleExcelTemplate(file, userToken.id);
  }
}
