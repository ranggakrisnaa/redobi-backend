import { IBaseEntity } from './base-entity.interface';
import { ICriteria } from './criteria-entity.interface';
import { ILecturer } from './lecturer-entity.interface';

export interface IAssessment extends IBaseEntity {
  id: number;
  lecturerId: string;
  score: number;
  lecturer?: ILecturer;
  criteria?: ICriteria;
}
