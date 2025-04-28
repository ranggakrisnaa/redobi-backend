import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { AssessmentSubCriteriaEntity } from '@/database/entities/assessment-sub-criteria.entity';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentSubCriteriaRepository } from '../assessment-sub-criteria/assessment-sub-criteria.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { SessionRepository } from '../session/session.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { AssessmentController } from './assessment.controller';
import { AssessmentRepository } from './assessment.repository';
import { AssessmentService } from './assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentEntity,
      AssessmentSubCriteriaEntity,
      SubCriteriaEntity,
      LecturerEntity,
      SessionEntity,
    ]),
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    AssessmentRepository,
    AssessmentSubCriteriaRepository,
    SubCriteriaRepository,
    LecturerRepository,
    SessionRepository,
    JwtService,
  ],
})
export class AssessmentModule {}
