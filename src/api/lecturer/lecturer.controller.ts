import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MulterService } from '../../multer/multer.service';
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

  @ApiAuth({
    summary: 'Generate Template Excel',
  })
  @Get('templates')
  async GenerateTemplateExcel(): Promise<
    Record<string, { supabaseUrl: string }>
  > {
    return await this.lecturerService.GenerateTemplateExcel();
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
  ) {
    return await this.lecturerService.HandleExcelTemplate(file, userToken.id);
  }

  @ApiAuth({
    type: CreateLecturerDto,
    summary: 'Create lecturer',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerImageOptions),
  )
  async Create(
    @Body() req: CreateLecturerDto,
    @CurrentUser() userToken: JwtPayloadType,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Record<string, ILecturer>> {
    return await this.lecturerService.Create(req, userToken.id, file);
  }

  @ApiAuth({
    type: UpdateLecturerDto,
    summary: 'Update lecturer',
  })
  @Put(':lecturerId')
  @UseInterceptors(
    FileInterceptor('file', new MulterService().multerImageOptions),
  )
  async Update(
    @Body() req: UpdateLecturerDto,
    @Param('lecturerId', ParseUUIDPipe) lecturerId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Record<string, ILecturer>> {
    return await this.lecturerService.Update(req, lecturerId, file);
  }

  @ApiAuth({
    summary: 'Pagination lecturer',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    return await this.lecturerService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Detail lecturer',
  })
  @Get(':lecturerId')
  async Detail(
    @Param('lecturerId', ParseUUIDPipe) lecturerId: string,
  ): Promise<Record<string, ILecturer>> {
    return await this.lecturerService.Detail(lecturerId);
  }

  @ApiAuth({
    summary: 'Delete lecturer',
    type: DeleteLecturerDto,
  })
  @Delete(':lecturerId?')
  async Delete(
    @Param('lecturerId') lecturerId: string,
    @Body() req: DeleteLecturerDto,
  ): Promise<Record<string, ILecturer | ILecturer[]>> {
    return await this.lecturerService.Delete(lecturerId, req);
  }
}
