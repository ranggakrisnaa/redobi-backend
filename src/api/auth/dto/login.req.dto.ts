import { EmailField, StringField } from '@/decorators/field.decorators';

export class LoginReqDto {
  @EmailField()
  email!: string;

  @StringField()
  password!: string;
}
