import { EmailField, StringField } from '@/decorators/field.decorators';

export class RequestPasswordDto {
  @EmailField()
  @StringField()
  email: string;
}
