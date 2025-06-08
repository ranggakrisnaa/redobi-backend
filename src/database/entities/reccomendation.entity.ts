import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { IRecommendation } from '../interface-model/recommendation-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { LecturerEntity } from './lecturer.entity';
import { StudentEntity } from './student.entity';

@Entity('recommendations')
export class RecommendationEntity
  extends AbstractEntity
  implements IRecommendation
{
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_recommendations_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
  lecturerId: Uuid;

  @Column({
    type: 'decimal',
    name: 'recommendation_score',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value.toFixed(2),
      from: (value: string) => parseFloat(value),
    },
  })
  recommendationScore: number;

  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_recommendation_students',
  })
  @ManyToOne(() => StudentEntity, (student) => student.recommendation)
  student!: IStudent;

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_recommendation_lecturers',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.recommendation)
  lecturer!: ILecturer;
}
