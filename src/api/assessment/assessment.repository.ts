import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AssessmentRepository extends Repository<AssessmentEntity> {
  constructor(
    @InjectRepository(AssessmentEntity)
    private readonly repo: Repository<AssessmentEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
