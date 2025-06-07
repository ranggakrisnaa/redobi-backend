import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import {
  EnumFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class ThesisKeywordReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;

  @EnumFieldOptional(() => ThesisKeywordCategoryEnum)
  category: ThesisKeywordCategoryEnum;
}
