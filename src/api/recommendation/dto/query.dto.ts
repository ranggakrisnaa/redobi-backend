import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { RecommendationStageEnum } from '@/common/enums/recommendation-stage.enum';
import {
  EnumFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class RecommendationPaginationReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;

  @EnumFieldOptional(() => RecommendationStageEnum)
  stage: RecommendationStageEnum;
}
