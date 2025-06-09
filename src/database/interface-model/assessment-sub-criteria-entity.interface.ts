import { Uuid } from '@/common/types/common.type';

export interface IAssessmentSubCriteria {
  id: number;
  subCriteriaId: number;
  score: number;
  assessmentId: Uuid;
}
