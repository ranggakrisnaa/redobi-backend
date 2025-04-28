import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { AssessmentSubCriteriaEntity } from './assessment-sub-criteria.entity';
import { LecturerEntity } from './lecturer.entity';

@Entity('assessments')
export class AssessmentEntity extends AbstractEntity implements IAssessment {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_assessments_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
  lecturerId: Uuid;

  @OneToMany(
    () => AssessmentSubCriteriaEntity,
    (assessmentSub) => assessmentSub.assessment,
  )
  assessmentSubCriteria?: AssessmentSubCriteriaEntity[];

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_lecturers',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.assessment)
  lecturer!: LecturerEntity;
}
