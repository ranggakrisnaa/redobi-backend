import { Uuid } from '@/common/types/common.type';
import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { AssessmentSubCriteriaEntity } from './assessment-sub-criteria.entity';

@Entity('assessments')
export class AssessmentEntity extends AbstractEntity implements IAssessment {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_assessments_id',
  })
  id: Uuid;

  @OneToMany(
    () => AssessmentSubCriteriaEntity,
    (assessmentSub) => assessmentSub.assessment,
  )
  assessmentSubCriteria?: AssessmentSubCriteriaEntity[];
}
