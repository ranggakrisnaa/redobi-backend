import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { StorageFileType } from '@/database/enums/file-type.enum';
import { ProdiEnum } from '@/database/enums/prodi.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { SupabaseService } from '@/libs/supabase/supabase.service';
import { getRelativeFilePath } from '@/utils/util';
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
import { In, Like, QueryFailedError } from 'typeorm';
import { StorageUrlRepository } from '../storage-url/storage-url.repository';
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
    private readonly supabaseService: SupabaseService,
    private readonly storageUrlRepository: StorageUrlRepository,
  ) {}

  async GenerateTemplateExcel(): Promise<
    Record<string, { supabaseUrl: string }>
  > {
    const columns = [
      { header: 'Nama dosen', key: 'fullName' },
      { header: 'NIDN', key: 'nidn' },
      { header: 'Prodi', key: 'prodi' },
      { header: 'Kuota Bimbingan', key: 'kotaBimbingan' },
      { header: 'Tipe Pembimbing', key: 'tipePembimbing' },
    ] as ColumnConfig[];
    const fileName = 'template-dosen.xlsx';

    try {
      const foundTemplate = await this.storageUrlRepository.findOne({
        where: { fileUrl: Like(`%${fileName}%`) },
      });
      let urlNew: string;

      if (!foundTemplate) {
        const file = await this.exceljsService.generateExcel(columns, []);
        const supabaseUrl = await this.supabaseService.uploadFile(
          file as Buffer<ArrayBufferLike>,
          fileName,
        );
        await this.storageUrlRepository.save({
          fileUrl: supabaseUrl,
          fileType: StorageFileType.EXCEL,
        });
        urlNew = supabaseUrl;
      }
      return { data: { supabaseUrl: foundTemplate?.fileUrl || urlNew } };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async HandleExcelTemplate(
    file: Express.Multer.File,
    userId: string,
  ): Promise<Record<string, ILecturer[]>> {
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

        const rowData = row.values;
        hasValidRow = true;

        // if (!Object.values(TipePembimbingEnum).includes(rowData[5]?.trim())) {
        //   errors.push({ row: rowNumber, message: 'Invalid tipe pembimbing' });
        // }

        if (!Object.values(ProdiEnum).includes(rowData[3]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid prodi' });
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
        throw new BadRequestException('Missing data in Excel');
      }

      return {
        data: await this.lecturerRepository.bulkCreate(lecturers),
      };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Create(
    req: CreateLecturerDto,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Record<string, ILecturer>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundLecturer = await this.lecturerRepository.findOneBy({
      nidn: req.nidn,
    });

    if (foundLecturer) {
      throw new ForbiddenException('Lecturer already exist');
    }

    if (file) {
      imageUrl = await this.supabaseService.uploadFile(
        file.buffer,
        file.originalname,
      );
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

      return { data: CreateLecturerDto.toResponse(data) as ILecturer };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Update(
    req: UpdateLecturerDto,
    lecturerId: string,
    file: Express.Multer.File,
  ): Promise<Record<string, ILecturer>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundLecturer = await this.lecturerRepository.findOneBy({
      id: lecturerId as Uuid,
    });

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer not found');
    }

    if (
      foundLecturer.imageUrl &&
      foundLecturer.imageUrl !== DEFAULT.IMAGE_DEFAULT
    ) {
      const relativePath = getRelativeFilePath(foundLecturer.imageUrl);
      await this.supabaseService.deleteFile(relativePath);
    }

    if (file) {
      imageUrl = await this.supabaseService.uploadFile(
        file.buffer,
        file.originalname,
      );
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

      return { data: CreateLecturerDto.toResponse(data) as ILecturer };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Pagination(
    reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    return this.lecturerRepository.Pagination(reqQuery);
  }

  async Detail(lecturerId: string): Promise<Record<string, ILecturer>> {
    const foundLecturer = await this.lecturerRepository.findOne({
      where: { id: lecturerId as Uuid },
      relations: [
        'recommendation',
        'recommendation.student',
        'recommendation.lecturer',
      ],
    });

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer data found.');
    }

    return { data: foundLecturer };
  }

  async Delete(
    lecturerId: string,
    req: DeleteLecturerDto,
  ): Promise<Record<string, ILecturer | ILecturer[]>> {
    const queryRunner =
      this.lecturerRepository.manager.connection.createQueryRunner();

    try {
      if (Array.isArray(req?.lecturerIds) && req.lecturerIds.length > 0) {
        const foundLecturers = await this.lecturerRepository.findBy({
          id: In(req.lecturerIds),
        });

        if (!foundLecturers.length) {
          throw new NotFoundException('Lecturer data not found.');
        }

        if (foundLecturers.length !== req.lecturerIds.length) {
          const foundIds = foundLecturers.map((l) => l.id);
          const notFoundIds = req.lecturerIds.filter(
            (id) => !foundIds.includes(id as Uuid),
          );
          throw new NotFoundException(
            `Some lecturers not found: ${notFoundIds.join(', ')}`,
          );
        }

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.query(
            `DELETE FROM ranking_normalized_matrices 
             WHERE ranking_matrices_id IN (
               SELECT id FROM ranking_matrices WHERE lecturer_id = ANY($1)
             )`,
            [req.lecturerIds],
          );

          await queryRunner.query(
            `DELETE FROM ranking_matrices 
             WHERE lecturer_id = ANY($1)`,
            [req.lecturerIds],
          );

          await queryRunner.query(
            `DELETE FROM normalized_matrices 
             WHERE lecturer_id = ANY($1)`,
            [req.lecturerIds],
          );

          await queryRunner.query(
            `DELETE FROM ranking_normalized_matrices 
             WHERE normalized_matrices_id IN (
               SELECT id FROM normalized_matrices WHERE lecturer_id = ANY($1)
             )`,
            [req.lecturerIds],
          );

          await queryRunner.query(
            `DELETE FROM assessment_sub_criteria 
             WHERE assessment_id IN (
               SELECT id FROM assessments WHERE lecturer_id = ANY($1)
             )`,
            [req.lecturerIds],
          );

          await queryRunner.query(
            `DELETE FROM assessments WHERE lecturer_id = ANY($1)`,
            [req.lecturerIds],
          );

          await queryRunner.query(`DELETE FROM lecturers WHERE id = ANY($1)`, [
            req.lecturerIds,
          ]);

          await queryRunner.commitTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }

        return {
          data: foundLecturers.map((lecturer) =>
            CreateLecturerDto.toResponse(lecturer),
          ) as ILecturer[],
        };
      } else {
        const foundLecturer = await this.lecturerRepository.findOneBy({
          id: lecturerId as Uuid,
        });

        if (!foundLecturer) {
          throw new NotFoundException('Lecturer not found');
        }

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.query(
            `DELETE FROM ranking_matrices WHERE lecturer_id = $1`,
            [lecturerId],
          );
          await queryRunner.query(
            `DELETE FROM assessment_sub_criteria 
             WHERE assessment_id IN (
               SELECT id FROM assessments WHERE lecturer_id = $1
             )`,
            [lecturerId],
          );

          await queryRunner.query(
            `DELETE FROM assessments WHERE lecturer_id = $1`,
            [lecturerId],
          );

          await queryRunner.query(`DELETE FROM lecturers WHERE id = $1`, [
            lecturerId,
          ]);

          await queryRunner.commitTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }

        return {
          data: CreateLecturerDto.toResponse(foundLecturer) as ILecturer,
        };
      }
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      if (err instanceof QueryFailedError) {
        throw new BadRequestException(`Database error: ${err.message}`);
      }

      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }

      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error occurred',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
