import { Uuid } from '@/common/types/common.type';
import { NumberField, StringField } from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

class ScoreDto {
  @NumberField()
  subCriteriaId: number;

  @NumberField()
  score: number;
}

export class CreateAssessmentDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  lecturerId: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least 1 sub-criteria must be filled.' })
  @Type(() => ScoreDto)
  scores: ScoreDto[];

  static toResponse(dto: Partial<CreateAssessmentDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
