import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ThesisKeywordsEntity } from '@/database/entities/thesis-keyword.entity';
import { IThesisKeyword } from '@/database/interface-model/thesis-keyword-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { ThesisKeywordReqQuery } from './dto/query.dto';

export class ThesisKeywordRepository extends Repository<ThesisKeywordsEntity> {
  constructor(
    @InjectRepository(ThesisKeywordsEntity)
    private readonly repo: Repository<ThesisKeywordsEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: ThesisKeywordReqQuery,
  ): Promise<OffsetPaginatedDto<IThesisKeyword>> {
    const targetName = this.repo.metadata.targetName;

    const baseQuery = this.repo
      .createQueryBuilder(targetName)
      .leftJoin(`${targetName}.keyword`, 'keyword');

    this.applyFilters(baseQuery, reqQuery, targetName);

    const totalUniqueRaw = await baseQuery
      .select('DISTINCT keyword.id', 'keywordId')
      .getRawMany();

    const totalUnique = totalUniqueRaw.length;

    const paginatedKeywordIds = totalUniqueRaw
      .slice(reqQuery.offset, reqQuery.offset + reqQuery.limit)
      .map((row) => row.keywordId);

    if (paginatedKeywordIds.length === 0) {
      const pagination = plainToInstance(
        OffsetPaginationDto,
        new OffsetPaginationDto(0, reqQuery),
        { excludeExtraneousValues: true },
      );
      return { data: [], pagination };
    }

    const dataQuery = this.repo
      .createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.keyword`, 'keyword')
      .where('keyword.id IN (:...keywordIds)', {
        keywordIds: paginatedKeywordIds,
      });

    this.applyFilters(dataQuery, reqQuery, targetName);

    const sortField = [
      { name: 'category', alias: `${targetName}.category` },
      { name: 'keyword', alias: 'keyword.name' },
      { name: 'name', alias: 'keyword.name' },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);

    dataQuery.orderBy(
      sortField?.alias ?? 'keyword.name',
      toOrderEnum(reqQuery.order) ?? 'ASC',
    );

    const data = await dataQuery.getMany();

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(totalUnique, reqQuery),
      { excludeExtraneousValues: true },
    );

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<ThesisKeywordsEntity>,
    req: ThesisKeywordReqQuery,
    targetName: string,
  ) {
    if (req.search) {
      query.andWhere('keyword.name ILIKE :search', {
        search: `%${req.search}%`,
      });
    }

    if (req.category) {
      query.andWhere(`${targetName}.category = :category`, {
        category: req.category,
      });
    }

    return query;
  }

  createWithTransaction(
    queryRunner: QueryRunner,
    thesisKeyword: Partial<IThesisKeyword>,
  ): Promise<Partial<IThesisKeyword>> {
    return queryRunner.manager.save(ThesisKeywordsEntity, thesisKeyword);
  }

  updateWithTransaction(
    queryRunner: QueryRunner,
    thesisKeyword: Partial<IThesisKeyword>,
  ): Promise<Partial<IThesisKeyword>> {
    return queryRunner.manager.save(ThesisKeywordsEntity, thesisKeyword);
  }
}
