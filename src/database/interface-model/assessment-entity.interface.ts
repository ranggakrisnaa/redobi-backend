import { Uuid } from '@/common/types/common.type';
import { IAssessmentSubCriteria } from './assessment-sub-criteria-entity.interface';
import { IBaseEntity } from './base-entity.interface';

export interface IAssessment extends IBaseEntity {
  id: Uuid;
  lecturerId: Uuid;
  assessmentSubCriteria?: IAssessmentSubCriteria[];
}
