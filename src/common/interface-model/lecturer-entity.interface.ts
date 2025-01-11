import { Uuid } from '../types/common.type';
import { IAssessment } from './assessment-entity.interface';
import { IBaseEntity } from './base-entity.interface';
import { IReccomendation } from './reccomendation-entity.interface';
import { ISelection } from './selection-entity.interface';
import { IUser } from './user-entity.interface';

export interface ILecturer extends IBaseEntity {
  id: Uuid;
  fullName: number;
  jumlahBimbingan: string;
  imageUrl: string;
  userId: Uuid;
  user?: IUser;
  selection?: ISelection[];
  reccomendation?: IReccomendation[];
  assessment?: IAssessment[];
}
