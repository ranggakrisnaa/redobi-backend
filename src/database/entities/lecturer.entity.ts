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
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { INormalizedMatrices } from '../interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '../interface-model/ranking-matrices-entity.interface';
import { IReccomendation } from '../interface-model/reccomendation-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { AssessmentEntity } from './assesment.entity';
import { NormalizedMatricesEntity } from './normalized-matrices.entity';
import { RankingMatricesEntity } from './ranking-matrix.entity';
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

  @Column({
    type: 'enum',
    enum: TipePembimbingEnum,
    name: 'tipe_pembimbing',
    nullable: true,
  })
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

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.lecturer)
  assessment?: IAssessment[];

  @OneToMany(
    () => NormalizedMatricesEntity,
    (normalized) => normalized.lecturer,
  )
  normalizedMatrices?: INormalizedMatrices[];

  @OneToMany(() => RankingMatricesEntity, (ranking) => ranking.lecturer)
  rankingMatrices?: IRankingMatrices[];
}
