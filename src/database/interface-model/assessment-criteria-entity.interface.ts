import { Uuid } from '@/common/types/common.type';

export class IAssessmentSubCriteria {
  id: number;
  subCriteriaId: number;
  lecturerId: string;
  score: number;
  assessmentId: Uuid;
}
