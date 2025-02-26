import { SessionEntity } from '@/common/entities/session.entity';
import { ISession } from '@/common/interface-model/session-entity.interface';
import { Uuid } from '@/common/types/common.type';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, QueryRunner, Repository, UpdateResult } from 'typeorm';

export class SessionRepository extends Repository<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async InsertSessionWithTransaction(
    queryRunner: QueryRunner,
    data: Partial<ISession>,
  ): Promise<InsertResult> {
    return await queryRunner.manager.insert(this.repo.metadata.target, data);
  }

  async UpdateSessionByUserIDWithTransaction(
    queryRunner: QueryRunner,
    id: Uuid,
    data: Partial<ISession>,
  ): Promise<UpdateResult> {
    return await queryRunner.manager.update(
      this.repo.metadata.target,
      { userId: id },
      data,
    );
  }
}
