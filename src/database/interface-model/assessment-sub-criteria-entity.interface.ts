import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';

export interface IAssessmentSubCriteria extends IBaseEntity {
  id: number;
  subCriteriaId: number;
  score: number;
  assessmentId: Uuid;
}
