import { Uuid } from '../types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IStudent } from './student-entity.interface';

export interface IReccomendation extends IBaseEntity {
  id: number;
  studentId: Uuid;
  lecturerId: Uuid;
  reccomendationScore: number;
  lecturer?: ILecturer;
  student?: IStudent;
}
