import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { DEFAULT } from '@/constants/app.constant';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create.req.dto';
import { StudentPaginationReqQuery } from './dto/query.req.dto';
import { StudentRepository } from './student.repository';

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: StudentRepository) {}

  async Pagination(
    reqQuery: StudentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IStudent>> {
    return this.studentRepository.Pagination(reqQuery);
  }

  async Create(
    req: CreateStudentDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<IStudent> {
    const foundStudent = await this.studentRepository.findOneBy({
      nim: req.nim,
    });
    if (foundStudent) {
      throw new ForbiddenException('Student data already exist.');
    }

    const imageUrl = file
      ? `${DEFAULT.IMAGE_PATH}/${file.filename}`
      : DEFAULT.IMAGE_DEFAULT;

    try {
      const newStudent = this.studentRepository.create({
        ...req,
        userId,
        imageUrl,
      });

      return await this.studentRepository.save(newStudent);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }
}
