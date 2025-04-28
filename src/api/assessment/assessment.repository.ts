import { Uuid } from '@/common/types/common.type';
import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { IAssessment } from '@/database/interface-model/assessment-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

export class AssessmentRepository extends Repository<AssessmentEntity> {
  constructor(
    @InjectRepository(AssessmentEntity)
    private readonly repo: Repository<AssessmentEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    lecturerId: string,
  ): Promise<Partial<IAssessment>> {
    const assessment = this.repo.create({
      lecturerId: lecturerId as Uuid,
    });

    return await queryRunner.manager.save(AssessmentEntity, assessment);
  }
}
