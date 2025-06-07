import { NumberFieldOptional } from '@/decorators/field.decorators';

export class DeleteThesisKeywordDto {
  @NumberFieldOptional({ each: true })
  thesisKeywordIds: number[];
}
