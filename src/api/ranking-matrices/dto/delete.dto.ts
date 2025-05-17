import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteRankingMatrix {
  @StringFieldOptional({ each: true })
  rankingMatrixIds: string[];
}
