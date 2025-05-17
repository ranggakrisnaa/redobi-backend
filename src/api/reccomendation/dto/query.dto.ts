import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { ReccomendationStageEnum } from '@/common/enums/reccomendation-stage.enum';
import {
  EnumFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class ReccomendationPaginationReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;

  @EnumFieldOptional(() => ReccomendationStageEnum)
  stage: ReccomendationStageEnum;
}
