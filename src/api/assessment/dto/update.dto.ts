import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentDto } from './create.dto';

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}
