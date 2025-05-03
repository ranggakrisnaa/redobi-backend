import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { INormalizedMatrices } from '../interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '../interface-model/ranking-matrices-entity.interface';
import { IRankingNormalizedMatrices } from '../interface-model/ranking-normalized-matrices-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { NormalizedMatricesEntity } from './normalized-matrices.entity';
import { RankingMatricesEntity } from './ranking-matrix.entity';

@Entity('ranking_normalized_matrices')
export class RankingNormalizedMatricesEntity
  extends AbstractEntity
  implements IRankingNormalizedMatrices
{
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_ranking_normalized_matrices_id',
  })
  id: number;

  @Column({ type: 'uuid', name: 'normalized_matrices_id' })
  normalizedMatricesId: Uuid;

  @Column({ type: 'uuid', name: 'ranking_matrices_id' })
  rankingMatricesId: Uuid;

  @JoinColumn({
    name: 'normalized_matrices_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName:
      'FK_ranking_normalized_matrices_normalized_matrices',
  })
  @ManyToOne(
    () => NormalizedMatricesEntity,
    (normalized) => normalized.rankingNormalizedMatrices,
  )
  normalizedMatrices?: INormalizedMatrices;

  @JoinColumn({
    name: 'ranking_matrices_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_ranking_normalized_matrices_ranking_matrices',
  })
  @ManyToOne(
    () => RankingMatricesEntity,
    (rankingNormalized) => rankingNormalized.rankingNormalizedMatrices,
  )
  rankingMatrices?: IRankingMatrices;
}
