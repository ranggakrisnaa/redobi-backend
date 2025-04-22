import { NumberFieldOptional } from '@/decorators/field.decorators';

export class DeleteCriteriaDto {
  @NumberFieldOptional({ each: true })
  criteriaIds: number[];
}
