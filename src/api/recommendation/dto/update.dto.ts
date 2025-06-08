import { Uuid } from '@/common/types/common.type';
import { StringField } from '@/decorators/field.decorators';

export class UpdateRecommendationDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField({ each: true })
  recommendationIds: string[];

  @StringField({ each: true })
  lecturerIds: string[];

  @StringField({ each: true })
  studentIds: string[];

  static toResponse(dto: Partial<UpdateRecommendationDto>) {
    return dto.recommendationIds.map((recomendationId: string) => ({
      id: recomendationId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    }));
  }
}
