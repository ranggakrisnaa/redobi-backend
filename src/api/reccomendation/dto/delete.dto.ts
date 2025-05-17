import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteReccomendationDto {
  @StringFieldOptional({ each: true })
  reccomendationIds: string[];
}
