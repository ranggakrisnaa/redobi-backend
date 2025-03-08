import { UserEntity } from '@/database/entities/user.entity';
import { IUser } from '@/database/interface-model/user-entity.interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthRepository extends Repository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async findOneByEmailOrUsername(
    emailOrUsername: string,
    relations?: string[],
  ): Promise<IUser> {
    return await this.repo.findOneOrFail({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
      relations: relations,
    });
  }
}
