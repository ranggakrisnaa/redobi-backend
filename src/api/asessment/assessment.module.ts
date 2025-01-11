import { AssessmentEntity } from '@/common/entities/assesment.entity';
import { CriteriaEntity } from '@/common/entities/criteria.entity';
import { LecturerEntity } from '@/common/entities/lecturer.entity';
import { SubCriteriaEntity } from '@/common/entities/sub-criteria.entity';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentEntity,
      LecturerEntity,
      CriteriaEntity,
      SubCriteriaEntity,
    ]),
    forwardRef(() => LecturerEntity),
  ],
  providers: [],
  exports: [],
})
export class AssessmentModule {}
