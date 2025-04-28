import { Controller } from '@nestjs/common';
import { AssessmentSubCriteriaService } from './assessment-sub-criteria.service';

@Controller('assessment-sub-criteria')
export class AssessmentSubCriteriaController {
  constructor(
    private readonly assessmentSubCriteriaService: AssessmentSubCriteriaService,
  ) {}
}
