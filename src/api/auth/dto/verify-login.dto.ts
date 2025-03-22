import { NumberField, UUIDField } from '@/decorators/field.decorators';

export class VerifyLoginReqDto {
  @UUIDField()
  userId: string;

  @NumberField()
  otpCode: number;
}
