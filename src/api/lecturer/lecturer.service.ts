import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { ProdiEnum } from '@/database/enums/prodi.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { AwsService } from '@/libs/aws/aws.service';
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
    private readonly awsService: AwsService,
  ) {}

  async GenerateTemplateExcel() {
    const columns = [
      { header: 'Nama dosen', key: 'fullName' },
      { header: 'NIDN', key: 'nidn' },
      { header: 'Prodi', key: 'prodi' },
      { header: 'Kuota Bimbingan', key: 'kotaBimbingan' },
      { header: 'Tipe Pembimbing', key: 'tipePembimbing' },
    ] as ColumnConfig[];

    try {
      return await this.exceljsService.generateExcel(columns, []);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
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
      let hasValidRow = false;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = row.values as any[];
        hasValidRow = true;

        if (!Object.values(TipePembimbingEnum).includes(rowData[5]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid tipe pembimbing.' });
        }

        if (!Object.values(ProdiEnum).includes(rowData[3]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid prodi.' });
        }

        const lecturer: Partial<ILecturer> = {
          fullName:
            typeof rowData[1] === 'string'
              ? rowData[1].trim()
              : INITIAL_VALUE.STRING,
          nidn:
            typeof rowData[2] === 'number'
              ? (rowData[2] as unknown as string)
              : INITIAL_VALUE.STRING,
          prodi:
            typeof rowData[3] === 'string'
              ? (rowData[3].trim() as ProdiEnum)
              : null,
          kuotaBimbingan:
            typeof rowData[4] === 'number' ? rowData[4] : INITIAL_VALUE.NUMBER,
          tipePembimbing:
            typeof rowData[5] === 'string'
              ? (rowData[5].trim() as TipePembimbingEnum)
              : null,
          jumlahBimbingan: INITIAL_VALUE.NUMBER,
          imageUrl: DEFAULT.IMAGE_DEFAULT,
          userId: userId as Uuid,
        };

        lecturers.push(lecturer as ILecturer);
      });

      if (errors.length > 0) {
        const errorMessage =
          `Found ${errors.length} errors in the Excel file:\n` +
          errors.map((e) => `Row ${e.row}: ${e.message}`).join('\n');
        throw new BadRequestException(errorMessage);
      }

      if (!hasValidRow) {
        throw new BadRequestException('Missing data in Excel.');
      }

      return await this.lecturerRepository.bulkCreate(lecturers);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Create(
    req: CreateLecturerDto,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundLecturer = await this.lecturerRepository.findOneBy({
      nidn: req.nidn,
    });

    if (foundLecturer) {
      throw new ForbiddenException('Lecturer data already exist.');
    }

    if (file) {
      imageUrl = await this.awsService.uploadFile(file);
    }

    const jumlahBimbingan = req.jumlahBimbingan ?? INITIAL_VALUE.NUMBER;

    try {
      const newLecturer = this.lecturerRepository.create({
        ...req,
        imageUrl,
        jumlahBimbingan,
        userId: userId as Uuid,
      });

      const data = await this.lecturerRepository.save(newLecturer);

      return CreateLecturerDto.toPlainLecturer(data);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Update(
    req: UpdateLecturerDto,
    lecturerId: string,
    file: Express.Multer.File,
  ): Promise<Partial<ILecturer>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundLecturer = await this.lecturerRepository.findOneBy({
      id: lecturerId as Uuid,
    });

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer data is not found.');
    }

    if (foundLecturer.imageUrl) {
      const key = this.awsService.extractKeyFromUrl(foundLecturer.imageUrl);
      await this.awsService.deleteFile(key);
    }

    if (file) {
      imageUrl = await this.awsService.uploadFile(file);
    }

    const jumlahBimbingan =
      req.jumlahBimbingan !== undefined
        ? req.jumlahBimbingan
        : (foundLecturer.jumlahBimbingan ?? INITIAL_VALUE.NUMBER);

    try {
      const data = await this.lecturerRepository.save({
        ...foundLecturer,
        ...req,
        imageUrl,
        jumlahBimbingan,
      });
      return CreateLecturerDto.toPlainLecturer(data);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Pagination(
    reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    return this.lecturerRepository.Pagination(reqQuery);
  }

  async Detail(lecturerId: string): Promise<ILecturer> {
    const foundLecturer = await this.lecturerRepository.findOneBy({
      id: lecturerId as Uuid,
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
    try {
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
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(lecturerId)) {
          throw new BadRequestException('Invalid UUID format.');
        }
        const foundLecturer = await this.lecturerRepository.findOneBy({
          id: lecturerId as Uuid,
        });

        if (!foundLecturer) {
          throw new NotFoundException('Lecturer data is not found.');
        }
        await this.lecturerRepository.softDelete(foundLecturer.id);
        return CreateLecturerDto.toPlainLecturer(foundLecturer);
      }
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unexpected error',
      );
    }
  }
}
