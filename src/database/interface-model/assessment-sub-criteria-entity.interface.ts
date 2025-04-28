import { Uuid } from '@/common/types/common.type';

export class IAssessmentSubCriteria {
  id: number;
  subCriteriaId: number;
  score: number;
  assessmentId: Uuid;
}
