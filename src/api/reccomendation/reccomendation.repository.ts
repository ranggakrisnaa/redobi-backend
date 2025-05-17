import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ReccomendationEntity } from '@/database/entities/reccomendation.entity';
import { IReccomendation } from '@/database/interface-model/reccomendation-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ReccomendationPaginationReqQuery } from './dto/query.dto';

export class ReccomendationRepository extends Repository<ReccomendationEntity> {
  constructor(
    @InjectRepository(ReccomendationEntity)
    private readonly repo: Repository<ReccomendationEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: ReccomendationPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IReccomendation>> {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName);

    this.applyFilters(query, reqQuery, targetName)
      .leftJoinAndSelect(`${targetName}.student`, 'student')
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer');

    const sortField = [
      { name: 'full_name', alias: `${targetName}.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      query.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
    } else {
      query.orderBy(`${targetName}.createdAt`, toOrderEnum(reqQuery.order));
    }

    query.limit(reqQuery.limit).offset(reqQuery.offset);

    const [data, total] = await query.getManyAndCount();

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(total, reqQuery),
      { excludeExtraneousValues: true },
    );

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<ReccomendationEntity>,
    _req: ReccomendationPaginationReqQuery,
    _targetName: string,
  ) {
    return query;
  }
}
