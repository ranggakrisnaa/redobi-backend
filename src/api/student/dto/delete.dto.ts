import { StringField } from '@/decorators/field.decorators';

export class DeleteStudentDto {
  @StringField({ each: true })
  studentIds: string[];
}
