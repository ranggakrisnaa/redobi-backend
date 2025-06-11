import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ICriteria } from '../interface-model/criteria-entity.interface';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { INormalizedMatrices } from '../interface-model/normalized-matrices-entity.interface';
import { IRankingNormalizedMatrices } from '../interface-model/ranking-normalized-matrices-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { CriteriaEntity } from './criteria.entity';
import { LecturerEntity } from './lecturer.entity';
import { RankingNormalizedMatricesEntity } from './ranking-normalized-matrices.entity';

@Entity('normalized_matrices')
export class NormalizedMatricesEntity
  extends AbstractEntity
  implements INormalizedMatrices
{
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_normalized_matrices_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
  lecturerId: Uuid;

  @Column({ type: 'int', name: 'criteria_id' })
  criteriaId: number;

  @Column({
    type: 'decimal',
    name: 'normalized_value',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  normalizedValue: number;

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_normalized_matrices_lecturer',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.normalizedMatrices)
  lecturer?: ILecturer;

  @JoinColumn({
    name: 'criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_normalized_matrices_criteria',
  })
  @ManyToOne(() => CriteriaEntity, (criteria) => criteria.normalizedMatrices)
  criteria?: ICriteria;

  @OneToMany(
    () => RankingNormalizedMatricesEntity,
    (rankingNormalized) => rankingNormalized.normalizedMatrices,
    {
      onDelete: 'CASCADE',
    },
  )
  rankingNormalizedMatrices?: IRankingNormalizedMatrices[];
}
