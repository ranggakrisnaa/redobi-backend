import { RankingMatricesEntity } from '@/database/entities/ranking-matrix.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class RankingMatricesRepository extends Repository<RankingMatricesEntity> {
  constructor(
    @InjectRepository(RankingMatricesEntity)
    private readonly repo: Repository<RankingMatricesEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
