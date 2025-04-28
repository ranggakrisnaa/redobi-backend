import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IAssessmentSubCriteria } from '../interface-model/assessment-sub-criteria-entity.interface';
import { ICriteria } from '../interface-model/criteria-entity.interface';
import { ISubCriteria } from '../interface-model/sub-criteria-entity.entity';
import { AbstractEntity } from './abstract.entity';
import { AssessmentSubCriteriaEntity } from './assessment-sub-criteria.entity';
import { CriteriaEntity } from './criteria.entity';

@Entity('sub_criteria')
export class SubCriteriaEntity extends AbstractEntity implements ISubCriteria {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_sub_criteria_id',
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

  @Column({ type: 'int', name: 'criteria_id' })
  criteriaId: number;
  @JoinColumn({
    name: 'criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_criteria_sub_criteria',
  })
  @ManyToOne(() => CriteriaEntity, (criteria) => criteria.subCriteria, {
    onDelete: 'CASCADE',
  })
  criteria!: ICriteria;

  @OneToMany(
    () => AssessmentSubCriteriaEntity,
    (assessmentSub) => assessmentSub.subCriteria,
  )
  assessmentSubCriteria?: IAssessmentSubCriteria[];
}
