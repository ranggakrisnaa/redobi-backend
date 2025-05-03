import { Uuid } from '@/common/types/common.type';
import { ProdiEnum } from '../enums/prodi.enum';
import { TipePembimbingEnum } from '../enums/tipe-pembimbing.enum';
import { IAssessment } from './assessment-entity.interface';
import { IBaseEntity } from './base-entity.interface';
import { INormalizedMatrices } from './normalized-matrices-entity.interface';
import { IRankingMatrices } from './ranking-matrices-entity.interface';
import { IReccomendation } from './reccomendation-entity.interface';
import { ISelection } from './selection-entity.interface';
import { IUser } from './user-entity.interface';

export interface ILecturer extends IBaseEntity {
  id: Uuid;
  nidn: string;
  fullName: string;
  jumlahBimbingan: number;
  tipePembimbing: TipePembimbingEnum;
  prodi: ProdiEnum;
  kuotaBimbingan: number;
  imageUrl: string;
  userId: Uuid;
  user?: IUser;
  selection?: ISelection[];
  reccomendation?: IReccomendation[];
  assessment?: IAssessment[];
  normalizedMatrices?: INormalizedMatrices[];
  rankingMatrices?: IRankingMatrices[];
}
