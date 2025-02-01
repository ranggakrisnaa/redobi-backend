import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ISession } from '../interface-model/session-entity.interface';
import { IUser } from '../interface-model/user-entity.interface';
import { Uuid } from '../types/common.type';
import { UserEntity } from './user.entity';

@Entity('sessions')
export class SessionEntity extends AbstractEntity implements ISession {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_session_id',
  })
  id: Uuid;

  @Column({ type: 'varchar', length: 255, name: 'hash_token' })
  hashToken: string;

  @Column({ type: 'int4', name: 'otp_code' })
  otpCode: number;

  @Column({ type: 'int4', name: 'otp_trial' })
  otpTrial: number;

  @Column({ type: 'bool', name: 'is_limit', default: false })
  isLimit: boolean;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: Uuid;
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_session_users',
  })
  @OneToOne(() => UserEntity, (user) => user.session)
  user!: IUser;
}
