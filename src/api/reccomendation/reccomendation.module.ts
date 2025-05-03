import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { NormalizedMatricesEntity } from '@/database/entities/normalized-matrices.entity';
import { ReccomendationEntity } from '@/database/entities/reccomendation.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { ReccomendationController } from './reccomendation.controller';
import { ReccomendationRepository } from './reccomendation.repository';
import { ReccomendationService } from './reccomendation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentEntity,
      CriteriaEntity,
      AssessmentEntity,
      ReccomendationEntity,
      SubCriteriaEntity,
      NormalizedMatricesEntity,
    ]),
  ],
  controllers: [ReccomendationController],
  providers: [
    ReccomendationService,
    AssessmentRepository,
    CriteriaRepository,
    ReccomendationRepository,
    SubCriteriaRepository,
    NormalizedMatrixRepository,
  ],
})
export class ReccomendationModule {}
