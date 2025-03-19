import { Uuid } from '@/common/types/common.type';
import { IUser } from '@/database/interface-model/user-entity.interface';
import {
  EmailField,
  PasswordField,
  StringField,
} from '@/decorators/field.decorators';

export class RegisterDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  fullName: string;

  @StringField()
  username: string;

  @EmailField()
  @StringField()
  email: string;

  @StringField()
  @PasswordField()
  password: string;

  static toPlainUser(data: RegisterDto): Partial<IUser> {
    return {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };
  }
}
