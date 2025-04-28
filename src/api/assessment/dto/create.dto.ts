import { NumberField, StringField } from '@/decorators/field.decorators';

export class CreateAssessmentDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  @StringField()
  lecturerId: string;

  @NumberField({ each: true })
  subCriteriaIds: number[];

  @NumberField({ each: true })
  scores: number[];

  static toResponse(dto: CreateAssessmentDto) {
    return {
      id: dto.id,
      lecturerId: dto.lecturerId,
      subCriteriaId: dto.subCriteriaIds[0],
      score: dto.scores[0],
    };
  }
}
