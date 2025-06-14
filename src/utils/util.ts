import { OrderDirectionEnum } from '@/common/enums/sort.enum';

export function toOrderEnum(order?: string): OrderDirectionEnum {
  if (order?.toUpperCase() === OrderDirectionEnum.Asc) {
    return OrderDirectionEnum.Asc;
  }
  return OrderDirectionEnum.Desc;
}

export function getRelativeFilePath(url: string): string {
  const path = url.split('/object/public/')[1];
  return path.replace(/^redobi\//, '');
}
