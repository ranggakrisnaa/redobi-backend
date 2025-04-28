import { AssessmentSubCriteriaEntity } from '@/database/entities/assessment-sub-criteria.entity';
import { IAssessmentSubCriteria } from '@/database/interface-model/assessment-sub-criteria-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

export class AssessmentSubCriteriaRepository extends Repository<AssessmentSubCriteriaEntity> {
  constructor(
    @InjectRepository(AssessmentSubCriteriaEntity)
    private readonly repo: Repository<AssessmentSubCriteriaEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async createtWithTransaction(
    queryRunner: QueryRunner,
    assessmentCriteria: Partial<IAssessmentSubCriteria[]>,
  ): Promise<Partial<IAssessmentSubCriteria[]>> {
    const entities = assessmentCriteria.map((data) => ({
      ...data,
    }));

    return await queryRunner.manager.save(
      AssessmentSubCriteriaEntity,
      entities,
    );
  }
}
