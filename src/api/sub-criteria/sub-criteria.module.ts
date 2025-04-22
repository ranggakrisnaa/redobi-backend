import { SessionEntity } from '@/database/entities/session.entity';
import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubCriteriaController } from './sub-criteria.controller';
import { SubCriteriaService } from './sub-criteria.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubCriteriaEntity, SessionEntity])],
  controllers: [SubCriteriaController],
  providers: [SubCriteriaService],
})
export class SubCriteriaModule {}
