import { PasswordField, StringField } from '@/decorators/field.decorators';

export class UpdatePasswordDto {
  @StringField()
  @PasswordField()
  oldPassword: string;

  @StringField()
  @PasswordField()
  newPassword: string;

  @StringField()
  @PasswordField()
  confirmPassword: string;
}
