import { SubCriteriaEntity } from '@/database/entities/sub-criteria.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class SubCriteriaRepository extends Repository<SubCriteriaEntity> {
  constructor(
    @InjectRepository(SubCriteriaEntity)
    private readonly repo: Repository<SubCriteriaEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
