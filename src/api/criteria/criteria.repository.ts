import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import { CriteriaEntity } from '@/database/entities/criteria.entity';
import { ICriteria } from '@/database/interface-model/criteria-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const ALLOW_TO_SORT = [
      { name: 'name', alias: `${targetName}.name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ];

    const query = this.createQueryBuilder(targetName).leftJoinAndSelect(
      `${targetName}.subCriteria`,
      'subCriteria',
    );
    const sortField = ALLOW_TO_SORT.find((sort) => sort.name === reqQuery.sort);

    if (sortField) {
      query.orderBy(sortField.alias, reqQuery.order as OrderDirectionEnum);
    } else {
      query.orderBy(`${targetName}.createdAt`, OrderDirectionEnum.Asc);
    }

    query
      .limit(reqQuery.limit ?? 10)
      .offset((reqQuery.page - 1) * (reqQuery.limit ?? 0));

    const [data, total] = await query.getManyAndCount();

    const metaDto = new OffsetPaginationDto(total, {
      limit: reqQuery.limit,
      offset: reqQuery.page,
    });

    return {
      data,
      pagination: metaDto,
    };
  }
}
