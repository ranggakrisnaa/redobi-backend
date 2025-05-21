import { NumberField, StringField } from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

class ScoreDto {
  @NumberField()
  assessmentSubCriteriaId: number;

  @NumberField()
  subCriteriaId: number;

  @NumberField()
  score: number;
}
export class UpdateAssessmentDto {
  @StringField()
  lecturerId: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least 1 sub-criteria must be filled.' })
  @Type(() => ScoreDto)
  scores: ScoreDto[];
}
