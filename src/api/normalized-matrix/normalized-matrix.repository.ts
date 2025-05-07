import { NormalizedMatricesEntity } from '@/database/entities/normalized-matrices.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class NormalizedMatrixRepository extends Repository<NormalizedMatricesEntity> {
  constructor(
    @InjectRepository(NormalizedMatricesEntity)
    private readonly repo: Repository<NormalizedMatricesEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async findAllNormalizedMatrixWithSumTotalValue() {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName)
      .select(`${targetName}.lecturerId`, 'lecturerId')
      .addSelect(`SUM(${targetName}.normalizedValue)`, 'finalScore')
      .groupBy(`${targetName}.lecturerId`);

    return await query.getRawMany();
  }
}
