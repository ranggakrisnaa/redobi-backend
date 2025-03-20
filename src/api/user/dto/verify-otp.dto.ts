import {
  EmailField,
  NumberField,
  StringField,
} from '@/decorators/field.decorators';

export class VerifyOtpDto {
  @EmailField()
  @StringField()
  email: string;

  @NumberField()
  otp: string;
}
