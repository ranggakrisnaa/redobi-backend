import { Uuid } from '@/common/types/common.type';
import { ProdiEnum } from '@/database/enums/prodi.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import {
  EnumField,
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

  @EnumField(() => TipePembimbingEnum)
  tipePembimbing: TipePembimbingEnum;

  @EnumField(() => ProdiEnum)
  prodi: ProdiEnum;

  @NumberField()
  kuotaBimbingan: number;

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
