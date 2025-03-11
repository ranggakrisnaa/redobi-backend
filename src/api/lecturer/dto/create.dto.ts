import { Uuid } from '@/common/types/common.type';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { EnumField, StringField } from '@/decorators/field.decorators';

export class CreateLecturerDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  nidn: string;

  @StringField()
  fullName: string;

  @EnumField(() => TipePembimbingEnum)
  tipePembimbing: TipePembimbingEnum;

  @StringField()
  imageUrl: string;

  static toPlainLecturer(dto: CreateLecturerDto): Partial<ILecturer> {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
