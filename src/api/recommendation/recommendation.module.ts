import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { NormalizedMatricesEntity } from '@/database/entities/normalized-matrices.entity';
import { RankingMatricesEntity } from '@/database/entities/ranking-matrix.entity';
import { RankingNormalizedMatricesEntity } from '@/database/entities/ranking-normalized-matrices.entity';
import { RecommendationEntity } from '@/database/entities/reccomendation.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { StorageUrlEntity } from '@/database/entities/storage-url.entity';
import { StudentEntity } from '@/database/entities/student.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { ThesisKeywordsEntity } from '@/database/entities/thesis-keyword.entity';
import { SupabaseService } from '@/libs/supabase/supabase.service';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { RankingMatricesRepository } from '../ranking-matrices/ranking-matrices.repository';
import { RankingNormalizedMatricesRepository } from '../ranking-normalized-matrices/ranking-normalized-matrices.repository';
import { SessionRepository } from '../session/session.repository';
import { StorageUrlRepository } from '../storage-url/storage-url.repository';
import { StudentRepository } from '../student/student.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { ThesisKeywordRepository } from '../thesis-keyword/thesis-keyword.repository';
import { RecommendationController } from './recommendation.controller';
import { RecommendationRepository } from './recommendation.repository';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentEntity,
      CriteriaEntity,
      AssessmentEntity,
      RecommendationEntity,
      SubCriteriaEntity,
      NormalizedMatricesEntity,
      RankingNormalizedMatricesEntity,
      RankingMatricesEntity,
      ThesisKeywordsEntity,
      StudentEntity,
      LecturerEntity,
      SessionEntity,
      StorageUrlEntity,
    ]),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    AssessmentRepository,
    CriteriaRepository,
    RecommendationRepository,
    SubCriteriaRepository,
    NormalizedMatrixRepository,
    RankingNormalizedMatricesRepository,
    RankingMatricesRepository,
    ThesisKeywordRepository,
    StudentRepository,
    LecturerRepository,
    SessionRepository,
    JwtService,
    SupabaseService,
    StorageUrlRepository,
  ],
})
export class RecommendationModule {}
