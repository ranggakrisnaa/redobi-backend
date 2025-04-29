import { StringField } from '@/decorators/field.decorators';

export class UpdateKeywordDto {
  @StringField()
  id: string;

  @StringField()
  name: string;
}
