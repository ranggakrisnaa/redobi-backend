import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteThesisKeywordDto {
  @StringFieldOptional({ each: true })
  thesisKeywordIds: string[];
}
