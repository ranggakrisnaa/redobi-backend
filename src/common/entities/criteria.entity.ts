import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CriteriaTypeEnum } from '../enums/criteria-type.enum';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { ISubCriteria } from '../interface-model/sub-criteria-entity.entity';
import { AssessmentEntity } from './assesment.entity';
import { SubCriteriaEntity } from './sub-criteria.entity';

@Entity('criteria')
export class CriteriaEntity extends AbstractEntity {
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
      from: (value: string) => parseInt(value),
    },
  })
  weight: number;

  @Column({ type: 'enum', enum: CriteriaTypeEnum })
  type: CriteriaTypeEnum;

  @Column({ type: 'int', name: 'sub_criteria_id' })
  subCriteriaId: number;

  @JoinColumn({
    name: 'sub_criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_criteria_users',
  })
  @ManyToOne(() => SubCriteriaEntity, (sub_criteria) => sub_criteria.criteria)
  sub_criteria!: ISubCriteria;

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.criteria)
  assessment?: IAssessment;
}
