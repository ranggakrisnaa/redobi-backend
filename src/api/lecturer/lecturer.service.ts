import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { ColumnConfig } from 'src/exceljs/interface/excel-js.interface';
import { In } from 'typeorm';
import { ErrHandleExcel } from '../student/types/error-handle-excel.type';
import { CreateLecturerDto } from './dto/create.dto';
import { DeleteLecturerDto } from './dto/delete.dto';
import { LecturerPaginationReqQuery } from './dto/query.dto';
import { UpdateLecturerDto } from './dto/update.dto';
import { LecturerRepository } from './lecturer.repository';

@Injectable()
export class LecturerService {
  constructor(
    private readonly exceljsService: ExcelJsService,
    private readonly lecturerRepository: LecturerRepository,
  ) {}

  async GenerateTemplateExcel() {
    const columns = [
      { header: 'Nama dosen', key: 'fullName' },
      { header: 'NIDN', key: 'nidn' },
      { header: 'Tipe Pembimbing', key: 'tipePembimbing' },
    ] as ColumnConfig[];

    try {
      return await this.exceljsService.generateExcel(columns, []);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }

  async HandleExcelTemplate(file: Express.Multer.File, userId: string) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new BadRequestException('Invalid Excel file.');

      const headers = worksheet.getRow(1).values as string[];
      if (!headers || headers.length < 3) {
        throw new BadRequestException(
          'Excel file has invalid or missing headers.',
        );
      }

      const lecturers: ILecturer[] = [];
      const errors: ErrHandleExcel[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = row.values as any[];

        if (!Object.values(TipePembimbingEnum).includes(rowData[3]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid tipe pembimbing.' });
        }

        const lecturer: Partial<ILecturer> = {
          fullName:
            typeof rowData[1] === 'string'
              ? rowData[1].trim()
              : INITIAL_VALUE.STRING,
          nidn:
            typeof rowData[2] === 'number'
              ? rowData[2].toString()
              : INITIAL_VALUE.STRING,
          tipePembimbing:
            typeof rowData[3] === 'string'
              ? (rowData[3].trim() as TipePembimbingEnum)
              : null,
          jumlahBimbingan: INITIAL_VALUE.NUMBER,
          imageUrl: DEFAULT.IMAGE_DEFAULT,
          userId: userId.toString() as Uuid,
        };

        lecturers.push(lecturer as ILecturer);
      });

      if (errors.length > 0) {
        const errorMessage =
          `Found ${errors.length} errors in the Excel file:\n` +
          errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n');
        throw new BadRequestException(errorMessage);
      }

      return await this.lecturerRepository.bulkCreate(lecturers);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }

  async Create(
    req: CreateLecturerDto,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    const foundLecturer = await this.lecturerRepository.findOneBy({
      nidn: req.nidn,
    });

    if (foundLecturer) {
      throw new ForbiddenException('Lecturer data already exist.');
    }

    const imageUrl = file
      ? `${DEFAULT.IMAGE_PATH}/${file.filename}`
      : DEFAULT.IMAGE_DEFAULT;

    const jumlahBimbingan = req.jumlahBimbingan ?? INITIAL_VALUE.NUMBER;

    try {
      const newLecturer = this.lecturerRepository.create({
        ...req,
        imageUrl,
        jumlahBimbingan,
        userId: userId.toString() as Uuid,
      });

      const data = await this.lecturerRepository.save(newLecturer);

      return CreateLecturerDto.toPlainLecturer(data);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }

  async Update(
    req: UpdateLecturerDto,
    lecturerId: string,
    file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    const foundLecturer = await this.lecturerRepository.findOneBy({
      id: lecturerId.toString() as Uuid,
    });

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer data is not found.');
    }

    const imageUrl = file
      ? `${DEFAULT.IMAGE_PATH}/${file.filename}`
      : foundLecturer
        ? foundLecturer.imageUrl
        : DEFAULT.IMAGE_DEFAULT;

    const jumlahBimbingan = req.jumlahBimbingan
      ? req.jumlahBimbingan
      : foundLecturer
        ? foundLecturer.jumlahBimbingan
        : INITIAL_VALUE.NUMBER;

    try {
      const data = await this.lecturerRepository.save({
        ...req,
        ...foundLecturer,
        imageUrl,
        jumlahBimbingan,
      });

      return CreateLecturerDto.toPlainLecturer(data);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }

  async Pagination(
    reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    return this.lecturerRepository.Pagination(reqQuery);
  }

  async Detail(lecturerId: string): Promise<ILecturer> {
    const foundLecturer = await this.lecturerRepository.findOneBy({
      id: lecturerId.toString() as Uuid,
    });

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer data is not found.');
    }

    return foundLecturer;
  }

  async Delete(
    lecturerId: string,
    req: DeleteLecturerDto,
  ): Promise<Partial<ILecturer> | Partial<ILecturer>[]> {
    console.log(req.lecturerIds);

    if (req?.lecturerIds.length > 0) {
      const foundLecturers = await this.lecturerRepository.findBy({
        id: In(req.lecturerIds),
      });

      if (!foundLecturers.length) {
        throw new NotFoundException('Lecturer data not found.');
      }

      await this.lecturerRepository.bulkDelete(req.lecturerIds);

      return foundLecturers.map((lecturer) =>
        CreateLecturerDto.toPlainLecturer(lecturer),
      );
    } else {
      const foundLecturer = await this.lecturerRepository.findOneBy({
        id: lecturerId.toString() as Uuid,
      });

      if (!foundLecturer) {
        throw new NotFoundException('Lect urer data is not found.');
      }

      await this.lecturerRepository.softDelete(foundLecturer.id);
      return CreateLecturerDto.toPlainLecturer(foundLecturer);
    }
  }
}
