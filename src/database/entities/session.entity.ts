import { Uuid } from '@/common/types/common.type';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ISession } from '../interface-model/session-entity.interface';
import { IUser } from '../interface-model/user-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { UserEntity } from './user.entity';

@Entity('sessions')
export class SessionEntity extends AbstractEntity implements ISession {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_session_id',
  })
  id: Uuid;

  @Column({ type: 'varchar', length: 255, name: 'access_token' })
  accessToken: string;

  @Column({ type: 'varchar', length: 255, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'int', name: 'otp_code' })
  otpCode: number;

  @Column({ type: 'int', name: 'otp_trial' })
  otpTrial: number;

  @Column({
    name: 'valid_otp_until',
    type: 'timestamptz',
    nullable: true,
  })
  validOtpUntil: Date;

  @Column({ type: 'bool', name: 'is_limit', default: false })
  isLimit: boolean;

  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
  })
  lockedUntil: Date;

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
