import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TipePembimbingEnum } from '../enums/tipe-pembimbing.enum';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { IReccomendation } from '../interface-model/reccomendation-entity.interface';
import { Uuid } from '../types/common.type';
import { AssessmentEntity } from './assesment.entity';
import { ReccomendationEntity } from './reccomendation.entity';
import { SelectionEntity } from './selection.entity';
import { UserEntity } from './user.entity';

@Entity('lecturers')
export class LecturerEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_lecturers_id',
  })
  id!: Uuid;

  @Column({ type: 'varchar', length: 200, name: 'full_name' })
  fullName: string;

  @Column({ type: 'int4', name: 'jumlah_bimbingan' })
  jumlahBimbingan: number;

  @Column({ type: 'enum', enum: TipePembimbingEnum, name: 'tipe_pembimbing' })
  tipePembimbing: TipePembimbingEnum;

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
    foreignKeyConstraintName: 'FK_lecturer_users',
  })
  @ManyToOne(() => UserEntity, (users) => users.lecturer)
  user!: Relation<UserEntity>;

  @OneToMany(() => SelectionEntity, (selection) => selection.lecturer)
  selection?: Relation<SelectionEntity[]>;

  @OneToMany(
    () => ReccomendationEntity,
    (reccomendation) => reccomendation.lecturer,
  )
  recomendation?: IReccomendation;

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.lecturer)
  assessment?: IAssessment;
}
