import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { StringFieldOptional } from '@/decorators/field.decorators';

export class AssessmentPaginationReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;
}
