import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';

export interface IAssessment extends IBaseEntity {
  id: Uuid;
}
