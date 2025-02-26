import { ClassEnum } from '@/database/enums/class.enum';
import { MajorEnum } from '@/database/enums/major.enum';
import {
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateStudentDto {
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

  @StringField()
  imageUrl: string;

  @StringFieldOptional()
  photoUrl: string;
}
