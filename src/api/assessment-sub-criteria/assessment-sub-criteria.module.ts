import { Module } from '@nestjs/common';
import { AssessmentSubCriteriaController } from './assessment-sub-criteria.controller';
import { AssessmentSubCriteriaService } from './assessment-sub-criteria.service';

@Module({
  controllers: [AssessmentSubCriteriaController],
  providers: [AssessmentSubCriteriaService],
})
export class AssessmentSubCriteriaModule {}
