import { Uuid } from '@/common/types/common.type';
import { StringField } from '@/decorators/field.decorators';

export class UpdateReccomendationDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField({ each: true })
  reccomendationIds: string[];

  @StringField({ each: true })
  lecturerIds: string[];

  @StringField({ each: true })
  studentIds: string[];

  static toResponse(dto: Partial<UpdateReccomendationDto>) {
    return dto.reccomendationIds.map((reccomendationId) => ({
      id: reccomendationId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    }));
  }
}
