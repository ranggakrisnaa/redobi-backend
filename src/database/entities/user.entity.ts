import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '../../common/types/common.type';
import { ILecturer } from '../interface-model/lecturer-entity.interface';
import { ISession } from '../interface-model/session-entity.interface';
import { IStudent } from '../interface-model/student-entity.interface';
import { IUser } from '../interface-model/user-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { LecturerEntity } from './lecturer.entity';
import { SessionEntity } from './session.entity';
import { StudentEntity } from './student.entity';

@Entity('users')
export class UserEntity extends AbstractEntity implements IUser {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_id' })
  id!: Uuid;

  @Column({ type: 'varchar', name: 'full_name', length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 100 })
  @Index('UQ_user_username', {
    unique: true,
  })
  username: string;

  @Column({ type: 'varchar', length: 200 })
  @Index('UQ_user_email', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl: string;

  @OneToMany(() => StudentEntity, (student) => student.user)
  student?: IStudent[];

  @OneToMany(() => LecturerEntity, (lecturer) => lecturer.user)
  lecturer?: ILecturer[];

  @OneToOne(() => SessionEntity, (session) => session.user)
  session?: ISession;
}
