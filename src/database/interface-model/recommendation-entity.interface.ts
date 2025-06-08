import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IStudent } from './student-entity.interface';

export interface IRecommendation extends IBaseEntity {
  id: Uuid;
  studentId: Uuid;
  lecturerId: Uuid;
  recommendationScore: number;
  lecturer?: ILecturer;
  student?: IStudent;
}
