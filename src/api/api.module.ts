import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { AuthModule } from './auth/auth.module';
import { CriteriaModule } from './criteria/criteria.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { LecturerModule } from './lecturer/lecturer.module';
import { SessionModule } from './session/session.module';
import { StudentModule } from './student/student.module';
import { SubCriteriaModule } from './sub-criteria/sub-criteria.module';
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
    SubCriteriaModule,
    AssessmentModule,
  ],
})
export class ApiModule {}
