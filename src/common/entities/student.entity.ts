import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClassEnum } from '../enums/class.enum';
import { MajorEnum } from '../enums/major.enum';
import { IReccomendation } from '../interface-model/reccomendation-entity.interface';
import { ISelection } from '../interface-model/selection-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { IUser } from '../interface-model/user-entity.interface';
import { Uuid } from '../types/common.type';
import { ReccomendationEntity } from './reccomendation.entity';
import { SelectionEntity } from './selection.entity';
import { UserEntity } from './user.entity';

@Entity('students')
export class StudentEntity extends AbstractEntity implements IStudent {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_students_id',
  })
  id!: Uuid;

  @Column({ type: 'varchar', name: 'full_name', length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 200 })
  nim: string;

  @Column({ type: 'int4', name: 'tahun_masuk' })
  tahunMasuk: number;

  @Column({ type: 'enum', enum: MajorEnum })
  major: MajorEnum;

  @Column({ type: 'text', name: 'judul_skripsi' })
  judulSkripsi: string;

  @Column({ type: 'text' })
  abstract: string;

  @Column({ type: 'enum', enum: ClassEnum })
  class: ClassEnum;

  @Column({ type: 'varchar', length: 200, name: 'image_url' })
  imageUrl: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_students_users',
  })
  @ManyToOne(() => UserEntity, (user) => user.lecturer)
  user!: IUser;

  @OneToMany(() => SelectionEntity, (selection) => selection.student)
  selection?: ISelection[];

  @OneToMany(
    () => ReccomendationEntity,
    (reccomendation) => reccomendation.student,
  )
  recomendation?: IReccomendation[];
}
