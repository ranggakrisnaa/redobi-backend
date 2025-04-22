import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteStudentDto {
  @StringFieldOptional({ each: true })
  studentIds: string[];
}
