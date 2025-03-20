import {
  EmailField,
  PasswordField,
  StringField,
} from '@/decorators/field.decorators';

export class UpdateEmailDto {
  @StringField()
  @EmailField()
  email: string;

  @StringField()
  @PasswordField()
  password: string;

  @StringField()
  @PasswordField()
  confirmPassword: string;
}
