import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { IRankingMatrices } from '../interface-model/ranking-matrices-entity.interface';
import { IRankingNormalizedMatrices } from '../interface-model/ranking-normalized-matrices-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { LecturerEntity } from './lecturer.entity';
import { RankingNormalizedMatricesEntity } from './ranking-normalized-matrices.entity';

@Entity('ranking_matrices')
export class RankingMatricesEntity
  extends AbstractEntity
  implements IRankingMatrices
{
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_ranking_Matrix_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
  lecturerId: Uuid;

  @Column({
    type: 'decimal',
    name: 'final_score',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  finalScore: number;

  @Column({ type: 'int', name: 'rank' })
  rank: number;

  @JoinColumn({
    name: 'lecturer_id',
    foreignKeyConstraintName: 'FK_ranking_matrix_lecturer',
    referencedColumnName: 'id',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.rankingMatrices)
  lecturer?: ILecturer;

  @OneToMany(
    () => RankingNormalizedMatricesEntity,
    (rankingNormalized) => rankingNormalized.rankingMatrices,
    { onDelete: 'CASCADE' },
  )
  rankingNormalizedMatrices?: IRankingNormalizedMatrices[];
}
