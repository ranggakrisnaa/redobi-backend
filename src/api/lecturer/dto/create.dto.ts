import { Uuid } from '@/common/types/common.type';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import {
  EnumField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateLecturerDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  nidn: string;

  @StringField()
  fullName: string;

  @NumberFieldOptional()
  jumlahBimbingan: number;

  @EnumField(() => TipePembimbingEnum)
  tipePembimbing: TipePembimbingEnum;

  @StringFieldOptional()
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
