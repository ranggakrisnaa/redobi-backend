import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RankingMatricesEntity } from '@/database/entities/ranking-matrix.entity';
import { IRankingMatrices } from '@/database/interface-model/ranking-matrices-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RecommendationPaginationReqQuery } from '../recommendation/dto/query.dto';

export class RankingMatricesRepository extends Repository<RankingMatricesEntity> {
  constructor(
    @InjectRepository(RankingMatricesEntity)
    private readonly repo: Repository<RankingMatricesEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: RecommendationPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IRankingMatrices>> {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName).leftJoinAndSelect(
      `${targetName}.lecturer`,
      'lecturer',
    );

    this.applyFilters(query, reqQuery);

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
    query: SelectQueryBuilder<RankingMatricesEntity>,
    req: RecommendationPaginationReqQuery,
    // targetName: string,
  ) {
    if (req.search) {
      query.andWhere(`lecturer.full_name ILIKE :search`, {
        search: `%${req.search}%`,
      });
    }

    return query;
  }
}
