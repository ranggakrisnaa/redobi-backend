import { Uuid } from '@/common/types/common.type';
import { ClassEnum } from '../../database/enums/class.enum';
import { MajorEnum } from '../../database/enums/major.enum';
import { IBaseEntity } from './base-entity.interface';
import { IReccomendation } from './reccomendation-entity.interface';
import { ISelection } from './selection-entity.interface';
import { IUser } from './user-entity.interface';

export interface IStudent extends IBaseEntity {
  id: Uuid;
  fullName: string;
  nim: string;
  tahunMasuk: number;
  major: MajorEnum;
  judulSkripsi: string;
  abstract: string;
  class: ClassEnum;
  imageUrl: string;
  userId: Uuid;
  user?: IUser;
  selection?: ISelection[];
  reccomendation?: IReccomendation[];
}
