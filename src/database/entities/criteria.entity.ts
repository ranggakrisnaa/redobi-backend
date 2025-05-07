import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CriteriaTypeEnum } from '../enums/criteria-type.enum';
import { ICriteria } from '../interface-model/criteria-entity.interface';
import { INormalizedMatrices } from '../interface-model/normalized-matrices-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { NormalizedMatricesEntity } from './normalized-matrices.entity';
import { SubCriteriaEntity } from './sub-criteria.entity';

@Entity('criteria')
export class CriteriaEntity extends AbstractEntity implements ICriteria {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_criteria_id',
  })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value.toFixed(2),
      from: (value: string) => parseFloat(value),
    },
  })
  weight: number;

  @Column({ type: 'enum', enum: CriteriaTypeEnum })
  type: CriteriaTypeEnum;

  @OneToMany(() => SubCriteriaEntity, (sub) => sub.criteria)
  subCriteria: SubCriteriaEntity[];

  @OneToMany(
    () => NormalizedMatricesEntity,
    (normalized) => normalized.criteria,
  )
  normalizedMatrices?: INormalizedMatrices[];
}
