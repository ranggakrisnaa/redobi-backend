import { IBaseEntity } from './base-entity.interface';
import { ICriteria } from './criteria-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { ISubCriteria } from './sub-criteria-entity.entity';

export interface IAssessment extends IBaseEntity {
  id: number;
  lecturerId: string;
  criteriaId: number;
  subCriteriaId: number;
  score: number;
  lecturer?: ILecturer;
  criteria?: ICriteria;
  subCriteria?: ISubCriteria;
}
