import { AuthGuard } from '@/guards/auth.guard';
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LecturerService } from './lecturer.service';

@Controller('lecturer')
@UseGuards(AuthGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @Get()
  async GenerateTemplateExcel(@Res() res: Response) {
    const bufferFile = await this.lecturerService.GenerateTemplateExcel();

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
    res.send(bufferFile);
  }
}
