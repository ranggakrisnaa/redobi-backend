import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { NormalizedMatricesEntity } from '@/database/entities/normalized-matrices.entity';
import { RankingMatricesEntity } from '@/database/entities/ranking-matrix.entity';
import { RankingNormalizedMatricesEntity } from '@/database/entities/ranking-normalized-matrices.entity';
import { ReccomendationEntity } from '@/database/entities/reccomendation.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { RankingMatricesRepository } from '../ranking-matrices/ranking-matrices.repository';
import { RankingNormalizedMatricesRepository } from '../ranking-normalized-matrices/ranking-normalized-matrices.repository';
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
      RankingNormalizedMatricesEntity,
      RankingMatricesEntity,
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
    RankingNormalizedMatricesRepository,
    RankingMatricesRepository,
  ],
})
export class ReccomendationModule {}
