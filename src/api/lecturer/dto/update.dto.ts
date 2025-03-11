import { PartialType } from '@nestjs/mapped-types';
import { CreateLecturerDto } from './create.dto';

export class UpdateLecturerDto extends PartialType(CreateLecturerDto) {}
