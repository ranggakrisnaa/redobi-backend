import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { ProdiEnum } from '../enums/prodi.enum';
import { TipePembimbingEnum } from '../enums/tipe-pembimbing.enum';
import { IAssessmentSubCriteria } from '../interface-model/assessment-criteria-entity.interface';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { IReccomendation } from '../interface-model/reccomendation-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { AssessmentSubCriteriaEntity } from './assessment-sub-criteria.entity';
import { ReccomendationEntity } from './reccomendation.entity';
import { SelectionEntity } from './selection.entity';
import { UserEntity } from './user.entity';

@Entity('lecturers')
export class LecturerEntity extends AbstractEntity implements ILecturer {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_lecturers_id',
  })
  id!: Uuid;

  @Column({ type: 'varchar', length: 200, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 200 })
  nidn: string;

  @Column({ type: 'int', name: 'jumlah_bimbingan' })
  jumlahBimbingan: number;

  @Column({ type: 'enum', enum: TipePembimbingEnum, name: 'tipe_pembimbing' })
  tipePembimbing: TipePembimbingEnum;

  @Column({ type: 'enum', enum: ProdiEnum, name: 'prodi' })
  prodi: ProdiEnum;

  @Column({ type: 'int', name: 'kuota_bimbingan' })
  kuotaBimbingan: number;

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
  recomendation?: IReccomendation[];

  @OneToMany(
    () => AssessmentSubCriteriaEntity,
    (assessment) => assessment.lecturer,
  )
  assessmentSubcriteria?: IAssessmentSubCriteria[];
}
