import { PartialType } from '@nestjs/swagger';
import { CreateStudentDto } from './create.req.dto';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
