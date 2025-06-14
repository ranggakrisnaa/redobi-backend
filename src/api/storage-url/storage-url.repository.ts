import { StorageUrlEntity } from '@/database/entities/storage-url.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StorageUrlRepository extends Repository<StorageUrlEntity> {
  constructor(
    @InjectRepository(StorageUrlEntity)
    private readonly repo: Repository<StorageUrlEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }
}
