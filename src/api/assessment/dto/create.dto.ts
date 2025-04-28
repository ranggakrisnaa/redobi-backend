import { Uuid } from '@/common/types/common.type';
import { NumberField, StringField } from '@/decorators/field.decorators';

export class CreateAssessmentDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  lecturerId: string;

  @NumberField({ each: true })
  subCriteriaIds: number[];

  @NumberField({ each: true })
  scores: number[];

  static toResponse(dto: Partial<CreateAssessmentDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
