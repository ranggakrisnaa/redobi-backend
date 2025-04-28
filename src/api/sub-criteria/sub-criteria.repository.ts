import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { ISubCriteria } from '@/database/interface-model/sub-criteria-entity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

export class SubCriteriaRepository extends Repository<SubCriteriaEntity> {
  constructor(
    @InjectRepository(SubCriteriaEntity)
    private readonly repo: Repository<SubCriteriaEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async createtWithTransaction(
    queryRunner: QueryRunner,
    criteriaId: number,
    subCriteria: Partial<ISubCriteria[]>,
  ): Promise<Partial<ISubCriteria[]>> {
    const entities = subCriteria.map((sub) => ({
      ...sub,
      criteriaId,
    }));

    const savedEntities = await queryRunner.manager.save(
      SubCriteriaEntity,
      entities,
    );
    return savedEntities;
  }
}
