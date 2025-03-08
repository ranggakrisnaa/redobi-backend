import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { ICriteria } from '../interface-model/criteria-entity.interface';
import { ISubCriteria } from '../interface-model/sub-criteria-entity.entity';
import { AbstractEntity } from './abstract.entity';
import { AssessmentEntity } from './assesment.entity';
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
      from: (value: string) => parseInt(value),
    },
  })
  weight: number;

  @OneToMany(() => CriteriaEntity, (criteria) => criteria.sub_criteria)
  criteria?: ICriteria[];

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.subCriteria)
  assessment?: IAssessment[];
}
