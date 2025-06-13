import { Uuid } from '@/common/types/common.type';
import { StorageFileType } from '../enums/file-type.enum';
import { IBaseEntity } from './base-entity.interface';

export interface IStorageUrl extends IBaseEntity {
  id: Uuid;
  fileUrl: string;
  fileType: StorageFileType;
}
