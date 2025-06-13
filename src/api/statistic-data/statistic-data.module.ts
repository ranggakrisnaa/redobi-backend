import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { StudentEntity } from '@/database/entities/student.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { SessionRepository } from '../session/session.repository';
import { StudentRepository } from '../student/student.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { StatisticDataController } from './statistic-data.controller';
import { StatisticDataService } from './statistic-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionEntity,
      StudentEntity,
      LecturerEntity,
      CriteriaEntity,
      SubCriteriaEntity,
    ]),
  ],
  controllers: [StatisticDataController],
  providers: [
    StatisticDataService,
    SessionRepository,
    LecturerRepository,
    StudentRepository,
    CriteriaRepository,
    SubCriteriaRepository,
    JwtService,
  ],
})
export class StatisticDataModule {}
