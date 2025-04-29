import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { IKeyword } from '@/database/interface-model/keyword-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

export class keywordRepository extends Repository<KeywordsEntity> {
  constructor(
    @InjectRepository(KeywordsEntity)
    private readonly repo: Repository<KeywordsEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  createWithTransaction(
    queryRunner: QueryRunner,
    keyword: Partial<IKeyword[]>,
  ): Promise<Partial<IKeyword[]>> {
    return queryRunner.manager.save(KeywordsEntity, keyword);
  }

  updateWithTransaction(
    queryRunner: QueryRunner,
    keywords: Partial<IKeyword[]>,
  ): Promise<Partial<IKeyword[]>> {
    return queryRunner.manager.save(KeywordsEntity, keywords);
  }
}
