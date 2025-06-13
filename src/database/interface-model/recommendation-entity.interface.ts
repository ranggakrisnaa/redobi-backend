import { Uuid } from '@/common/types/common.type';
import { TipePembimbingEnum } from '../enums/tipe-pembimbing.enum';
import { IBaseEntity } from './base-entity.interface';
import { ILecturer } from './lecturer-entity.interface';
import { IStudent } from './student-entity.interface';

export interface IRecommendation extends IBaseEntity {
  id: Uuid;
  studentId: Uuid;
  lecturerId: Uuid;
  recommendationScore: number;
  position: TipePembimbingEnum;
  lecturer?: ILecturer;
  student?: IStudent;
}
