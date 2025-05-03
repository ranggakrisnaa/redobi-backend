import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { INormalizedMatrices } from './normalized-matrices-entity.interface';
import { IRankingMatrices } from './ranking-matrices-entity.interface';

export interface IRankingNormalizedMatrices extends IBaseEntity {
  id: number;
  rankingMatricesId: Uuid;
  normalizedMatricesId: Uuid;
  rankingMatrices?: IRankingMatrices;
  normalizedMatrices?: INormalizedMatrices;
}
