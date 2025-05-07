import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { ICriteria } from './criteria-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IRankingNormalizedMatrices } from './ranking-normalized-matrices-entity.interface';

export interface INormalizedMatrices extends IBaseEntity {
  id: Uuid;
  criteriaId: number;
  lecturerId: Uuid;
  normalizedValue: number;
  criteria?: ICriteria;
  lecturer?: ILecturer;
  rankingNormalizedMatrices?: IRankingNormalizedMatrices[];
}
