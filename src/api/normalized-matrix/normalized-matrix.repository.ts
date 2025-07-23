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

    const baseQuery = this.repo
      .createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer')
      .leftJoinAndSelect(`${targetName}.criteria`, 'criteria');

    this.applyFilters(baseQuery, reqQuery);

    const sortField = [
      { name: 'full_name', alias: `lecturer.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      baseQuery.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
    } else {
      baseQuery.orderBy(`${targetName}.createdAt`, toOrderEnum(reqQuery.order));
    }

    const subQuery = this.repo
      .createQueryBuilder(targetName)
      .select(`${targetName}.lecturerId`, 'lecturerId')
      .groupBy(`${targetName}.lecturerId`);

    this.applyFilters(subQuery, reqQuery);
    const lecturerIdsRaw = await subQuery.getRawMany();
    const lecturerIds = lecturerIdsRaw.map((row) => row.lecturerId);
    const total = lecturerIds.length;

    if (lecturerIds.length === 0) {
      const pagination = plainToInstance(
        OffsetPaginationDto,
        new OffsetPaginationDto(0, reqQuery),
        { excludeExtraneousValues: true },
      );
      return { data: [], pagination };
    }

    const pagedLecturerIds = lecturerIds.slice(
      reqQuery.offset,
      reqQuery.offset + reqQuery.limit,
    );

    baseQuery.andWhere(`${targetName}.lecturerId IN (:...lecturerIds)`, {
      lecturerIds: pagedLecturerIds,
    });

    const data = await baseQuery.getMany();

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
      .addSelect(
        `CAST(SUM(${targetName}.normalizedValue) AS DECIMAL(18,3))`,
        'finalScore',
      )
      .leftJoin(
        'criteria',
        'criteria',
        `criteria.id = ${targetName}.criteriaId`,
      )
      .groupBy(`${targetName}.lecturerId`);

    const result = await query.getRawMany();

    return result.map((row) => ({
      lecturerId: row.lecturerId,
      finalScore: Math.round(parseFloat(row.finalScore) * 1000) / 1000,
    }));
  }
}
