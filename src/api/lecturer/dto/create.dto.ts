import { Uuid } from '@/common/types/common.type';
import { ProdiEnum } from '@/database/enums/prodi.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import {
  EnumField,
  EnumFieldOptional,
  NumberField,
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

  @EnumFieldOptional(() => TipePembimbingEnum)
  tipePembimbing: TipePembimbingEnum;

  @EnumField(() => ProdiEnum)
  prodi: ProdiEnum;

  @NumberField()
  kuotaBimbingan: number;

  @StringFieldOptional()
  imageUrl: string;

  static toResponse(dto: Partial<CreateLecturerDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
