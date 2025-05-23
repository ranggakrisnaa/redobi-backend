import { CreateSubCriteria } from '@/api/sub-criteria/dto/create.dto';
import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import {
  EnumField,
  NumberField,
  StringField,
} from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

export class CreateCriteriaDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  name: string;

  @NumberField()
  weight: number;

  @EnumField(() => CriteriaTypeEnum)
  type: CriteriaTypeEnum;

  @ValidateNested({ each: true })
  @Type(() => CreateSubCriteria)
  @ArrayMinSize(1, { message: 'At least 1 sub-criteria must be filled.' })
  subCriteria: CreateSubCriteria[];

  static toResponse(dto: Partial<CreateCriteriaDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
