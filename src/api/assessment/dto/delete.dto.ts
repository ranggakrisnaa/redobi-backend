import { StringFieldOptional } from '@/decorators/field.decorators';

export class DeleteAssessmentDto {
  @StringFieldOptional({ each: true })
  assessmentIds: string[];
}
