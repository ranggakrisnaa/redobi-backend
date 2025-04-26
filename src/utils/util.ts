import { OrderDirectionEnum } from '@/common/enums/sort.enum';

export function toOrderEnum(order?: string): OrderDirectionEnum {
  if (order?.toUpperCase() === OrderDirectionEnum.Asc) {
    return OrderDirectionEnum.Asc;
  }
  return OrderDirectionEnum.Desc;
}
