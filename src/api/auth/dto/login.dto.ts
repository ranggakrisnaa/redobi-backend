import {
  EmailField,
  PasswordField,
  StringField,
} from '@/decorators/field.decorators';

export class LoginReqDto {
  @EmailField()
  @StringField()
  email: string;

  @PasswordField()
  @StringField()
  password: string;
}
