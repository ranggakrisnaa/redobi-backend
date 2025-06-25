import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { ICriteria } from '@/database/interface-model/criteria-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { CriteriaPaginationReqQuery } from './dto/query.dto';

export class CriteriaRepository extends Repository<CriteriaEntity> {
  constructor(
    @InjectRepository(CriteriaEntity)
    private readonly repo: Repository<CriteriaEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: CriteriaPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ICriteria>> {
    const targetName = this.repo.metadata.targetName;

    const idQuery = this.createQueryBuilder(targetName)
      .select(`${targetName}.id`)
      .limit(reqQuery.limit)
      .offset(reqQuery.offset);
    this.applyFilters(idQuery, reqQuery, targetName);

    const ids = await idQuery.getRawMany();
    const criteriaIds = ids.map((row) => row[`${targetName}_id`]);

    const criteriaQuery = this.createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.subCriteria`, 'subCriteria')
      .whereInIds(criteriaIds);

    const sortField = [
      { name: 'name', alias: `${targetName}.name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      criteriaQuery.orderBy(
        sortField.alias,
        reqQuery.order as OrderDirectionEnum,
      );
    } else {
      criteriaQuery.orderBy(`${targetName}.createdAt`, OrderDirectionEnum.Asc);
    }

    const [data, total] = await criteriaQuery.getManyAndCount();

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(total, reqQuery),
      { excludeExtraneousValues: true },
    );

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<CriteriaEntity>,
    req: CriteriaPaginationReqQuery,
    targetName: string,
  ) {
    if (req.search) {
      query.andWhere(
        `${targetName}.name ILIKE :search OR subCriteria.name ILIKE :search`,
        { search: `%${req.search}%` },
      );
    }

    if (req.type) {
      query.andWhere(`${targetName}.type = :type`, {
        type: req.type,
      });
    }
  }

  async createtWithTransaction(
    queryRunner: QueryRunner,
    criteria: Partial<ICriteria>,
  ): Promise<Partial<ICriteria>> {
    const entities = this.repo.create(criteria);

    return await queryRunner.manager.save(CriteriaEntity, entities);
  }
}
