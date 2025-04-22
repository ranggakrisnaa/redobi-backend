import { NumberField, StringField } from '@/decorators/field.decorators';

export class CreateSubCriteria {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  name: string;

  @NumberField()
  weight: number;
}
