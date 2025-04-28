import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IStudent } from './student-entity.interface';

export interface ISelection extends IBaseEntity {
  id: Uuid;
  studentId: Uuid;
  lecturerId: Uuid;
  lecturer?: ILecturer;
  student?: IStudent;
}
