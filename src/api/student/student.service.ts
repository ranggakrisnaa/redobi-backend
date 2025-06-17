import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { ClassEnum } from '@/database/enums/class.enum';
import { StorageFileType } from '@/database/enums/file-type.enum';
import { MajorEnum } from '@/database/enums/major.enum';
import { IStudent } from '@/database/interface-model/student-entity.interface';
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
import { In, Like } from 'typeorm';
import { StorageUrlRepository } from '../storage-url/storage-url.repository';
import { CreateStudentDto } from './dto/create.dto';
import { DeleteStudentDto } from './dto/delete.dto';
import { StudentPaginationReqQuery } from './dto/query.req.dto';
import { UpdateStudentDto } from './dto/update.dto';
import { StudentRepository } from './student.repository';
import { ErrHandleExcel } from './types/error-handle-excel.type';

@Injectable()
export class StudentService {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly exceljsService: ExcelJsService,
    private readonly supabaseService: SupabaseService,
    private readonly storageUrlRepository: StorageUrlRepository,
  ) {}

  async Pagination(
    reqQuery: StudentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IStudent>> {
    return this.studentRepository.Pagination(reqQuery);
  }

  async Create(
    req: CreateStudentDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<Record<string, IStudent>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundStudent = await this.studentRepository.findOneBy({
      nim: req.nim,
    });
    if (foundStudent) {
      throw new ForbiddenException('Student already exist');
    }

    if (file) {
      imageUrl = await this.supabaseService.uploadFile(
        file.buffer,
        file.originalname,
      );
    }

    try {
      const newStudent = this.studentRepository.create({
        ...req,
        userId,
        imageUrl,
      });

      const data = await this.studentRepository.save(newStudent);
      return { data: CreateStudentDto.toResponse(data) as IStudent };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Update(
    req: UpdateStudentDto,
    studentId: string,
    file: Express.Multer.File,
  ): Promise<Record<string, IStudent>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundStudent = await this.studentRepository.findOneBy({
      id: studentId as Uuid,
    });

    if (!foundStudent) {
      throw new Error('Student not found');
    }

    if (
      foundStudent.imageUrl &&
      foundStudent.imageUrl !== DEFAULT.IMAGE_DEFAULT
    ) {
      const relativePath = getRelativeFilePath(foundStudent.imageUrl);
      await this.supabaseService.deleteFile(relativePath);
    }

    if (file) {
      imageUrl = await this.supabaseService.uploadFile(
        file.buffer,
        file.originalname,
      );
    }

    try {
      const data = await this.studentRepository.save({
        ...foundStudent,
        ...req,
        imageUrl,
      });
      return { data: CreateStudentDto.toResponse(data) as IStudent };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Detail(studentId: string): Promise<Record<string, IStudent>> {
    const foundStudent = await this.studentRepository.findOne({
      where: { id: studentId as Uuid },
      relations: ['recommendation', 'recommendation.lecturer'],
    });

    if (!foundStudent) {
      throw new NotFoundException('Student not found');
    }

    return { data: foundStudent };
  }
  async Delete(
    studentId: string,
    req: DeleteStudentDto,
  ): Promise<Record<string, IStudent | IStudent[]>> {
    const queryRunner =
      this.studentRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (Array.isArray(req?.studentIds) && req.studentIds.length > 0) {
        const foundStudents = await this.studentRepository.findBy({
          id: In(req.studentIds),
        });

        if (!foundStudents.length) {
          throw new NotFoundException('Student not found');
        }

        try {
          await queryRunner.query(
            `DELETE FROM recommendations WHERE student_id = ANY($1)`,
            [req.studentIds],
          );

          await queryRunner.query(`DELETE FROM students WHERE id = ANY($1)`, [
            req.studentIds,
          ]);

          await queryRunner.commitTransaction();

          return {
            data: foundStudents.map((student) =>
              CreateStudentDto.toResponse(student),
            ) as IStudent[],
          };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }
      } else {
        const foundStudent = await this.studentRepository.findOneBy({
          id: studentId as Uuid,
        });

        if (!foundStudent) {
          throw new NotFoundException('Student not found');
        }

        try {
          await queryRunner.query(
            `DELETE FROM recommendations WHERE student_id = $1`,
            [studentId],
          );

          await queryRunner.query(`DELETE FROM students WHERE id = $1`, [
            studentId,
          ]);

          await queryRunner.commitTransaction();

          return {
            data: CreateStudentDto.toResponse(foundStudent) as IStudent,
          };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }
      }
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async GenerateTemplateExcel(): Promise<
    Record<string, { supabaseUrl: string }>
  > {
    const columns = [
      { header: 'Nama Mahasiswa', key: 'fullName' },
      { header: 'NIM', key: 'nim' },
      { header: 'Tahun Masuk', key: 'tahunMasuk' },
      { header: 'Jurusan', key: 'major' },
      { header: 'Judul Skripsi', key: 'judulSkripsi' },
      { header: 'Abstract', key: 'abstract' },
      { header: 'Kelas', key: 'class' },
    ] as ColumnConfig[];
    const fileName = 'template-mahasiswa.xlsx';

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
  ): Promise<Record<string, IStudent[]>> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new BadRequestException('Invalid Excel file');

      const headers = worksheet.getRow(1).values as string[];
      if (!headers || headers.length < 7) {
        throw new BadRequestException(
          'Excel file has invalid or missing headers.',
        );
      }

      const students: IStudent[] = [];
      const errors: ErrHandleExcel[] = [];
      let hasValidRow = false;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = row.values as any[];
        hasValidRow = true;

        if (!Object.values(MajorEnum).includes(rowData[4]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid major.' });
        }

        if (!Object.values(ClassEnum).includes(rowData[7]?.trim())) {
          errors.push({ row: rowNumber, message: 'Invalid class.' });
        }

        const student: Partial<IStudent> = {
          fullName:
            typeof rowData[1] === 'string'
              ? rowData[1].trim()
              : INITIAL_VALUE.STRING,
          nim:
            typeof rowData[2] === 'number'
              ? (rowData[2] as unknown as string)
              : INITIAL_VALUE.STRING,
          tahunMasuk:
            typeof rowData[3] === 'number'
              ? rowData[3] || null
              : INITIAL_VALUE.NUMBER,
          major:
            typeof rowData[4] === 'string'
              ? (rowData[4].trim() as MajorEnum)
              : null,
          judulSkripsi:
            typeof rowData[5] === 'string'
              ? rowData[5].trim()
              : INITIAL_VALUE.STRING,
          abstract:
            typeof rowData[6] === 'string'
              ? rowData[6].trim()
              : INITIAL_VALUE.STRING,
          class:
            typeof rowData[7] === 'string'
              ? (rowData[7].trim() as ClassEnum)
              : null,
          imageUrl: DEFAULT.IMAGE_DEFAULT,
          userId: userId as Uuid,
        };

        students.push(student as IStudent);
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

      return { data: await this.studentRepository.bulkCreate(students) };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }
}
