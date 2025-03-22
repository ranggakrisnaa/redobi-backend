import {
  EmailField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';

export class ResendOtpDto {
  @UUIDField()
  userId: string;

  @EmailField()
  @StringField()
  email: string;
}
