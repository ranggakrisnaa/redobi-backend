import {
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class UpdateSubCriteria {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  @NumberFieldOptional()
  id: number;

  @StringFieldOptional()
  name: string;

  @NumberFieldOptional()
  weight: number;
}
