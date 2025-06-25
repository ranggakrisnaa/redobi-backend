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
    try {
      const targetName = this.repo.metadata.targetName;

      const countQuery = this.createQueryBuilder(targetName).leftJoin(
        `${targetName}.keyword`,
        'keyword',
      );

      this.applyFilters(countQuery, reqQuery, targetName);
      const total = await countQuery.getCount();

      const idQuery = this.createQueryBuilder(targetName)
        .select(`${targetName}.id`)
        .leftJoin(`${targetName}.keyword`, 'keyword');

      this.applyFilters(idQuery, reqQuery, targetName);

      const sortField = [
        { name: 'category', alias: `${targetName}.category` },
        { name: 'name', alias: `keyword.name` },
        { name: 'created_at', alias: `${targetName}.createdAt` },
      ].find((sort) => sort.name === reqQuery.sort);

      if (sortField) {
        idQuery.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
      } else {
        idQuery.orderBy(`${targetName}.createdAt`, toOrderEnum(reqQuery.order));
      }

      idQuery.limit(reqQuery.limit).offset(reqQuery.offset);

      const ids = await idQuery.getMany();

      const thesisIds = ids.map((row) => row.id);

      const thesisQuery = this.createQueryBuilder(targetName)
        .leftJoinAndSelect(`${targetName}.keyword`, 'keyword')
        .whereInIds(thesisIds);

      if (sortField) {
        thesisQuery.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
      } else {
        thesisQuery.orderBy(
          `${targetName}.createdAt`,
          toOrderEnum(reqQuery.order),
        );
      }

      const data = await thesisQuery.getMany();

      const pagination = plainToInstance(
        OffsetPaginationDto,
        new OffsetPaginationDto(total, reqQuery),
        { excludeExtraneousValues: true },
      );

      return {
        data,
        pagination: pagination,
      };
    } catch (error) {
      console.error('Pagination error:', error);
      throw new Error(`Failed to paginate thesis keywords: ${error.message}`);
    }
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
