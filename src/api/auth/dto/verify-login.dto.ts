import { NumberField, StringField } from '@/decorators/field.decorators';

export class VerifyLoginReqDto {
  @StringField()
  userId: string;

  @NumberField()
  otpCode: number;
}
