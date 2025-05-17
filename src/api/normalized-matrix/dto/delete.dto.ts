import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteNormalizedMatrix {
  @StringFieldOptional({ each: true })
  normalizedMatrixIds: string[];
}
