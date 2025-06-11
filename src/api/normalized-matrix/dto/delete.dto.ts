import {
  BooleanFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class DeleteNormalizedMatrix {
  @StringFieldOptional({ each: true })
  normalizedMatrixIds: string[];

  @BooleanFieldOptional()
  deleteAll: boolean;
}
