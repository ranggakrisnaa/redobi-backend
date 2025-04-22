import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteLecturerDto {
  @StringFieldOptional({ each: true })
  lecturerIds: string[];
}
