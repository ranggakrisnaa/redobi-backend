import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { ISelection } from '../interface-model/selection-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { Uuid } from '../types/common.type';
import { LecturerEntity } from './lecturer.entity';
import { StudentEntity } from './student.entity';

@Entity('selections')
export class SelectionEntity extends AbstractEntity implements ISelection {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_selections_id',
  })
  id: number;

  @Column({ type: 'int', name: 'student_id' })
  studentId: Uuid;

  @Column({ type: 'int', name: 'lecturer_id' })
  lecturerId: Uuid;

  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_selection_students',
  })
  @ManyToOne(() => StudentEntity, (student) => student.selection)
  student!: IStudent;

  @JoinColumn({
    name: 'lecturer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_selection_lecturers',
  })
  @ManyToOne(() => LecturerEntity, (lecturer) => lecturer.selection)
  lecturer!: ILecturer;
}
