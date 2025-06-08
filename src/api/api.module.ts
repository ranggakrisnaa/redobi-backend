import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { AuthModule } from './auth/auth.module';
import { CriteriaModule } from './criteria/criteria.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { LecturerModule } from './lecturer/lecturer.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { SessionModule } from './session/session.module';
import { StudentModule } from './student/student.module';
import { ThesisKeywordModule } from './thesis-keyword/thesis-keyword.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    HomeModule,
    SessionModule,
    StudentModule,
    LecturerModule,
    UserModule,
    CriteriaModule,
    AssessmentModule,
    ThesisKeywordModule,
    RecommendationModule,
  ],
})
export class ApiModule {}
