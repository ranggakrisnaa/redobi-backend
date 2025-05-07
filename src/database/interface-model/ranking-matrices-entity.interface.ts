import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IRankingNormalizedMatrices } from './ranking-normalized-matrices-entity.interface';

export interface IRankingMatrices extends IBaseEntity {
  id: Uuid;
  lecturerId: Uuid;
  finalScore: number;
  rank: number;
  lecturer?: ILecturer;
  rankingNormalizedMatrices?: IRankingNormalizedMatrices[];
}
