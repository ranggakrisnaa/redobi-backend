import { Uuid } from '@/common/types/common.type';
import { IBaseEntity } from './base-entity.interface';
import { IUser } from './user-entity.interface';

export interface ISession extends IBaseEntity {
  id: Uuid;
  refreshToken: string;
  otpCode: number;
  otpTrial: number;
  isLimit: boolean;
  lockedUntil: Date;
  userId: Uuid;
  user?: IUser;
}
