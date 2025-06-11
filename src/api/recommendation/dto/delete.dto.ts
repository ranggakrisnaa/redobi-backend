import {
  BooleanFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class DeleteRecommendationDto {
  @StringFieldOptional({ each: true })
  recommendationIds: string[];

  @BooleanFieldOptional()
  deleteAll: boolean;
}
