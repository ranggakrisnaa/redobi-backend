import { UpdateSubCriteria } from '@/api/sub-criteria/dto/update.dto';
import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

export class UpdateCriteriaDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringFieldOptional()
  name: string;

  @NumberFieldOptional()
  weight: number;

  @EnumFieldOptional(() => CriteriaTypeEnum)
  type: CriteriaTypeEnum;

  @ValidateNested({ each: true })
  @Type(() => UpdateSubCriteria)
  @ArrayMinSize(1, { message: 'Minimal 1 sub-kriteria harus diisi.' })
  subCriteria: UpdateSubCriteria[];
}
