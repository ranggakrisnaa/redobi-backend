import { Uuid } from '@/common/types/common.type';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { StorageFileType } from '../enums/file-type.enum';
import { IStorageUrl } from '../interface-model/storage-url-entity.interface';
import { AbstractEntity } from './abstract.entity';

@Entity('storage_urls')
export class StorageUrlEntity extends AbstractEntity implements IStorageUrl {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_storage_urls_id',
  })
  id: Uuid;

  @Column({ type: 'enum', enum: StorageFileType, name: 'file_type' })
  fileType: StorageFileType;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl: string;
}
