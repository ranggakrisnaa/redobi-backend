import { IAssessmentSubCriteria } from './assessment-sub-criteria-entity.interface';
import { IBaseEntity } from './base-entity.interface';
import { ICriteria } from './criteria-entity.interface';

export interface ISubCriteria extends IBaseEntity {
  id: number;
  name: string;
  weight: number;
  criteria?: ICriteria;
  criteriaId: number;
  assessmentSubCriteria?: IAssessmentSubCriteria[];
}
