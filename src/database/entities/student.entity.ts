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

import { Uuid } from '../../common/types/common.type';
import { IRecommendation } from '../interface-model/recommendation-entity.interface';
import { ISelection } from '../interface-model/selection-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { IUser } from '../interface-model/user-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { RecommendationEntity } from './reccomendation.entity';
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

  @Column({ type: 'int', name: 'tahun_masuk' })
  tahunMasuk: number;

  @Column({ type: 'enum', enum: MajorEnum })
  major: MajorEnum;

  @Column({ type: 'text', name: 'judul_skripsi' })
  judulSkripsi: string;

  @Column({ type: 'text' })
  abstract: string;

  @Column({ type: 'enum', enum: ClassEnum })
  class: ClassEnum;

  @Column({ type: 'text', name: 'image_url' })
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
  @ManyToOne(() => UserEntity, (user) => user.student)
  user!: IUser;

  @OneToMany(() => SelectionEntity, (selection) => selection.student)
  selection?: ISelection[];

  @OneToMany(
    () => RecommendationEntity,
    (recommendation) => recommendation.student,
  )
  recommendation?: IRecommendation[];
}
