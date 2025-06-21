import { Uuid } from '@/common/types/common.type';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { EnumField, StringField } from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

class LecturersDto {
  @StringField({ each: true })
  lecturerId: string;

  @EnumField(() => TipePembimbingEnum)
  positions: TipePembimbingEnum;
}

export class UpdateRecommendationDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField({ each: true })
  recommendationIds: string[];

  @StringField({ each: true })
  studentIds: string[];

  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least 1 sub-criteria must be filled.' })
  @Type(() => LecturersDto)
  lecturers: LecturersDto[];

  static toResponse(dto: Partial<UpdateRecommendationDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
