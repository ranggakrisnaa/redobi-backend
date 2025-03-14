import { forwardRef, Module } from '@nestjs/common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { IAssessment } from '../interface-model/assessment-entity.interface';
import { ICriteria } from '../interface-model/criteria-entity.interface';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { ISubCriteria } from '../interface-model/sub-criteria-entity.entity';
import { AbstractEntity } from './abstract.entity';
import { CriteriaEntity } from './criteria.entity';
import { LecturerEntity } from './lecturer.entity';
import { SubCriteriaEntity } from './sub-criteria.entity';

@Module({
  imports: [forwardRef(() => LecturerEntity)],
})
@Entity('assessments')
export class AssessmentEntity extends AbstractEntity implements IAssessment {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_assessments_id',
  })
  id: number;

  @Column({ type: 'int', name: 'lecturer_id' })
  lecturerId: Uuid;

  @Column({ type: 'int', name: 'criteria_id' })
  criteriaId: number;

  @Column({ type: 'int', name: 'sub_criteria_id' })
  subCriteriaId: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value.toFixed(2),
      from: (value: string) => parseInt(value),
    },
  })
  score: number;

  @JoinColumn({
    name: 'criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_criteria',
  })
  @ManyToOne(() => CriteriaEntity, (criteria) => criteria.assessment)
  criteria!: ICriteria;

  @JoinColumn({
    name: 'sub_criteria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_sub_criteria',
  })
  @ManyToOne(() => SubCriteriaEntity, (subCriteria) => subCriteria.assessment)
  subCriteria!: ISubCriteria;

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_assessment_lecturers',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.assessment)
  lecturer!: ILecturer;
}
