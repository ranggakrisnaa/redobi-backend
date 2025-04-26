import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_LIMIT,
} from '@/constants/app.constant';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class PageOptionsDto {
  @StringFieldOptional()
  afterCursor?: string;

  @StringFieldOptional()
  beforeCursor?: string;

  @NumberFieldOptional({
    min: 1,
    default: DEFAULT_PAGE_LIMIT,
    int: true,
  })
  readonly limit?: number = DEFAULT_PAGE_LIMIT;

  @NumberFieldOptional({
    min: 1,
    default: DEFAULT_CURRENT_PAGE,
    int: true,
  })
  readonly page?: number = DEFAULT_CURRENT_PAGE;

  @StringFieldOptional()
  readonly q?: string;

  @StringFieldOptional()
  readonly sort?: string;

  @EnumFieldOptional(() => OrderDirectionEnum)
  readonly order?: OrderDirectionEnum;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
