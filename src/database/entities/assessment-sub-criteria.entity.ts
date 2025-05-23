import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { IAssessmentSubCriteria } from '../interface-model/assessment-sub-criteria-entity.interface';
import { ISubCriteria } from '../interface-model/sub-criteria-entity.entity';
import { AbstractEntity } from './abstract.entity';
import { AssessmentEntity } from './assesment.entity';
import { SubCriteriaEntity } from './sub-criteria.entity';

@Entity('assessment_sub_criteria')
export class AssessmentSubCriteriaEntity
  extends AbstractEntity
  implements IAssessmentSubCriteria
{
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_assessment_sub_criteria_id',
  })
  id: number;

  @Column({ type: 'int', name: 'sub_criteria_id' })
  subCriteriaId: number;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: Uuid;

  @Column({
    type: 'int',
  })
  score: number;

  @JoinColumn({
    name: 'sub_criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_sub_criteria',
  })
  @ManyToOne(() => SubCriteriaEntity, (sub) => sub.assessmentSubCriteria, {
    onDelete: 'CASCADE',
  })
  subCriteria!: ISubCriteria;

  @JoinColumn({
    name: 'assessment_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_sub_criteria_assessments',
  })
  @ManyToOne(
    () => AssessmentEntity,
    (assessment) => assessment.assessmentSubCriteria,
    {
      onDelete: 'CASCADE',
    },
  )
  assessment!: IAssessment;
}
