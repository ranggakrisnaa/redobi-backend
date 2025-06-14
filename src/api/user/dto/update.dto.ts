import { Uuid } from '@/common/types/common.type';
import { StringField } from '@/decorators/field.decorators';

export class UpdateUserDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @StringField()
  fullName: string;

  @StringField()
  email: string;

  @StringField()
  username: string;

  static toPlainUser(data: UpdateUserDto): Partial<UpdateUserDto> {
    return {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };
  }
}
