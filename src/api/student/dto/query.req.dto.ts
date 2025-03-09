import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import {
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class StudentPaginationReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;

  @StringFieldOptional()
  class: string;

  @NumberFieldOptional()
  tahun_masuk: number;

  @StringFieldOptional()
  major: string;
}
