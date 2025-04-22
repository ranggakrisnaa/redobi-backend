import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionRepository } from '../session/session.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { CriteriaController } from './criteria.controller';
import { CriteriaRepository } from './criteria.repository';
import { CriteriaService } from './criteria.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaEntity,
      SubCriteriaEntity,
      SessionEntity,
    ]),
  ],
  controllers: [CriteriaController],
  providers: [
    CriteriaService,
    CriteriaRepository,
    SubCriteriaRepository,
    SessionRepository,
    JwtService,
  ],
})
export class CriteriaModule {}
