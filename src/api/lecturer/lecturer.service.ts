import { Uuid } from '@/common/types/common.type';
import { INITIAL_VALUE } from '@/constants/app.constant';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { ColumnConfig } from 'src/exceljs/interface/excel-js.interface';
import { ErrHandleExcel } from '../student/types/error-handle-excel.type';
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
}
