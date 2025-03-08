import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create.req.dto';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
