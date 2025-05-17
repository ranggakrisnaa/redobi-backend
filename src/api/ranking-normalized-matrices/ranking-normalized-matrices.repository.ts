import { RankingNormalizedMatricesEntity } from '@/database/entities/ranking-normalized-matrices.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class RankingNormalizedMatricesRepository extends Repository<RankingNormalizedMatricesEntity> {
  constructor(
    @InjectRepository(RankingNormalizedMatricesEntity)
    private readonly repo: Repository<RankingNormalizedMatricesEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
