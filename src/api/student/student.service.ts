import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { DEFAULT, INITIAL_VALUE } from '@/constants/app.constant';
import { ClassEnum } from '@/database/enums/class.enum';
import { MajorEnum } from '@/database/enums/major.enum';
import { IStudent } from '@/database/interface-model/student-entity.interface';
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
    private readonly awsService: AwsService,
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
  ): Promise<Partial<IStudent>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundStudent = await this.studentRepository.findOneBy({
      nim: req.nim,
    });
    if (foundStudent) {
      throw new ForbiddenException('Student data already exist.');
    }

    if (file) {
      imageUrl = await this.awsService.uploadFile(file);
    }

    try {
      const newStudent = this.studentRepository.create({
        ...req,
        userId,
        imageUrl,
      });

      const data = await this.studentRepository.save(newStudent);
      return CreateStudentDto.toPlainStudent(data);
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
  ): Promise<Partial<IStudent>> {
    let imageUrl = DEFAULT.IMAGE_DEFAULT;
    const foundStudent = await this.studentRepository.findOneBy({
      id: studentId as Uuid,
    });

    if (!foundStudent) {
      throw new Error('Student data not found.');
    }

    if (foundStudent.imageUrl) {
      const key = this.awsService.extractKeyFromUrl(foundStudent.imageUrl);
      await this.awsService.deleteFile(key);
    }

    if (file) {
      imageUrl = await this.awsService.uploadFile(file);
    }

    try {
      const data = await this.studentRepository.save({
        ...foundStudent,
        ...req,
        imageUrl,
      });
      return CreateStudentDto.toPlainStudent(data);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Detail(studentId: string): Promise<IStudent> {
    const foundStudent = await this.studentRepository.findOneBy({
      id: studentId as Uuid,
    });
    if (!foundStudent) {
      throw new NotFoundException('Student data not found.');
    }

    return foundStudent;
  }

  async Delete(
    studentId: string,
    req: DeleteStudentDto,
  ): Promise<Partial<IStudent> | Partial<IStudent>[]> {
    try {
      if (req.studentIds.length > 0) {
        const foundStudents = await this.studentRepository.findBy({
          id: In(req.studentIds),
        });

        if (!foundStudents.length) {
          throw new NotFoundException('Student data not found.');
        }

        await this.studentRepository.bulkDelete(req.studentIds);

        return foundStudents.map((student) =>
          CreateStudentDto.toPlainStudent(student),
        );
      } else {
        const foundStudent = await this.studentRepository.findOneBy({
          id: studentId as Uuid,
        });

        if (!foundStudent) {
          throw new NotFoundException('Student data not found.');
        }

        await this.studentRepository.softDelete(foundStudent.id);
        return CreateStudentDto.toPlainStudent(foundStudent);
      }
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async GenerateTemplateExcel(): Promise<Buffer | ArrayBuffer> {
    const columns = [
      { header: 'Nama Mahasiswa', key: 'fullName' },
      { header: 'NIM', key: 'nim' },
      { header: 'Tahun Masuk', key: 'tahunMasuk' },
      { header: 'Jurusan', key: 'major' },
      { header: 'Judul Skripsi', key: 'judulSkripsi' },
      { header: 'Abstract', key: 'abstract' },
      { header: 'Kelas', key: 'class' },
    ] as ColumnConfig[];

    try {
      return await this.exceljsService.generateExcel(columns, []);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async HandleExcelTemplate(
    file: Express.Multer.File,
    userId: string,
  ): Promise<IStudent[]> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new BadRequestException('Invalid Excel file.');

      const headers = worksheet.getRow(1).values as string[];
      if (!headers || headers.length < 7) {
        throw new BadRequestException(
          'Excel file has invalid or missing headers.',
        );
      }

      const students: IStudent[] = [];
      const errors: ErrHandleExcel[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = row.values as any[];

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

      return await this.studentRepository.bulkCreate(students);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }
}
