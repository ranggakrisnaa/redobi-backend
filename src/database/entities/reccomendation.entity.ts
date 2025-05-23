import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { IReccomendation } from '../interface-model/reccomendation-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { LecturerEntity } from './lecturer.entity';
import { StudentEntity } from './student.entity';

@Entity('reccomendations')
export class ReccomendationEntity
  extends AbstractEntity
  implements IReccomendation
{
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_reccomendations_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
  lecturerId: Uuid;

  @Column({
    type: 'decimal',
    name: 'reccomendation_score',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value.toFixed(2),
      from: (value: string) => parseFloat(value),
    },
  })
  reccomendationScore: number;

  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_reccomendation_students',
  })
  @ManyToOne(() => StudentEntity, (student) => student.recomendation)
  student!: IStudent;

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_reccomendation_lecturers',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.recomendation)
  lecturer!: ILecturer;
}
