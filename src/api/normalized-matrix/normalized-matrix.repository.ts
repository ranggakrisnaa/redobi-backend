import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { NormalizedMatricesEntity } from '@/database/entities/normalized-matrices.entity';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RecommendationPaginationReqQuery } from '../recommendation/dto/query.dto';

export class NormalizedMatrixRepository extends Repository<NormalizedMatricesEntity> {
  constructor(
    @InjectRepository(NormalizedMatricesEntity)
    private readonly repo: Repository<NormalizedMatricesEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: RecommendationPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<INormalizedMatrices>> {
    const targetName = this.repo.metadata.targetName;
    const lecturerIdsQuery = this.createQueryBuilder(targetName)
      .select(`${targetName}.lecturerId`, 'lecturerId')
      .groupBy(`${targetName}.lecturerId`)
      .limit(reqQuery.limit)
      .offset(reqQuery.offset);

    const lecturerIdsRaw = await lecturerIdsQuery.getRawMany();
    const lecturerIds = lecturerIdsRaw.map((row) => row.lecturerId);

    if (lecturerIds.length === 0) {
      const pagination = plainToInstance(
        OffsetPaginationDto,
        new OffsetPaginationDto(0, reqQuery),
        { excludeExtraneousValues: true },
      );
      return { data: [], pagination };
    }

    const query = this.repo
      .createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer')
      .leftJoinAndSelect(`${targetName}.criteria`, 'criteria')
      .where(`${targetName}.lecturerId IN (:...lecturerIds)`, { lecturerIds });

    this.applyFilters(query, reqQuery);
    const data = await query.getMany();

    const sortField = [
      { name: 'full_name', alias: `${targetName}.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      query.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
    } else {
      query.orderBy(`${targetName}.createdAt`, toOrderEnum(reqQuery.order));
    }

    const total = lecturerIdsRaw.length;

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(total, reqQuery),
      { excludeExtraneousValues: true },
    );

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<NormalizedMatricesEntity>,
    req: RecommendationPaginationReqQuery,
    // targetName: string,
  ) {
    if (req.search) {
      query.andWhere(
        `lecturer.full_name ILIKE :search OR criteria.name ILIKE :search`,
        {
          search: `%${req.search}%`,
        },
      );
    }

    return query;
  }

  async findAllNormalizedMatrixWithSumTotalValue() {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName)
      .select(`${targetName}.lecturerId`, 'lecturerId')
      .addSelect(`SUM(${targetName}.normalizedValue)`, 'finalScore')
      .leftJoin(
        'criteria',
        'criteria',
        `criteria.id = ${targetName}.criteriaId`,
      )
      .groupBy(`${targetName}.lecturerId`);
    return await query.getRawMany();
  }
}
