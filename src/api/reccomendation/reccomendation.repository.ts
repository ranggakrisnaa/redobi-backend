import { ReccomendationEntity } from '@/database/entities/reccomendation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ReccomendationRepository extends Repository<ReccomendationEntity> {
  constructor(
    @InjectRepository(ReccomendationEntity)
    private readonly repo: Repository<ReccomendationEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
