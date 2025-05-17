import { Uuid } from '@/common/types/common.type';
import { ClassEnum } from '@/database/enums/class.enum';
import { MajorEnum } from '@/database/enums/major.enum';
import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateStudentDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  fullName: string;

  @StringField()
  nim: string;

  @NumberField()
  tahunMasuk: number;

  @EnumField(() => MajorEnum)
  major: MajorEnum;

  @StringField()
  judulSkripsi: string;

  @StringField()
  abstract: string;

  @EnumField(() => ClassEnum)
  class: ClassEnum;

  @StringFieldOptional()
  imageUrl: string;

  static toResponse(dto: Partial<CreateStudentDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
