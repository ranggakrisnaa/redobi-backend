import { StringField } from '@/decorators/field.decorators';

export class DeleteLecturerDto {
  @StringField({ each: true })
  lecturerIds: string[];
}
