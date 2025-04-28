import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { ISelection } from '../interface-model/selection-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { LecturerEntity } from './lecturer.entity';
import { StudentEntity } from './student.entity';

@Entity('selections')
export class SelectionEntity extends AbstractEntity implements ISelection {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_selections_id',
  })
  id: Uuid;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: Uuid;

  @Column({ type: 'uuid', name: 'lecturer_id' })
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
