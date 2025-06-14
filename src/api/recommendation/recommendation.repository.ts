import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RecommendationEntity } from '@/database/entities/reccomendation.entity';
import { IRecommendation } from '@/database/interface-model/recommendation-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RecommendationPaginationReqQuery } from './dto/query.dto';

export class RecommendationRepository extends Repository<RecommendationEntity> {
  constructor(
    @InjectRepository(RecommendationEntity)
    private readonly repo: Repository<RecommendationEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: RecommendationPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IRecommendation>> {
    const targetName = this.repo.metadata.targetName;

    const studentIdsQuery = this.repo
      .createQueryBuilder(targetName)
      .select(`${targetName}.studentId`, 'studentId')
      .where(`${targetName}.studentId IS NOT NULL`)
      .groupBy(`${targetName}.studentId`)
      .limit(reqQuery.limit)
      .offset(reqQuery.offset);

    const studentIdsRaw = await studentIdsQuery.getRawMany();
    const studentIds = studentIdsRaw.map((row) => row.studentId);

    if (studentIds.length === 0) {
      const pagination = plainToInstance(
        OffsetPaginationDto,
        new OffsetPaginationDto(0, reqQuery),
        { excludeExtraneousValues: true },
      );
      return { data: [], pagination };
    }

    const query = this.repo
      .createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.student`, 'student')
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer')
      .where(`${targetName}.studentId IN (:...studentIds)`, { studentIds });

    this.applyFilters(query, reqQuery);
    const data = await query.getMany();

    const totalUniqueRaw = await this.repo
      .createQueryBuilder(targetName)
      .select(`${targetName}.studentId`)
      .where(`${targetName}.studentId IS NOT NULL`)
      .groupBy(`${targetName}.studentId`)
      .getRawMany();
    const totalUnique = totalUniqueRaw.length;

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(totalUnique, reqQuery),
      { excludeExtraneousValues: true },
    );

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<RecommendationEntity>,
    req: RecommendationPaginationReqQuery,
    // targetName: string,
  ) {
    if (req.search) {
      query.andWhere(
        'lecturer.full_name ILIKE :search OR student.full_name ILIKE :search',
        {
          search: `%${req.search}%`,
        },
      );
    }
    return query;
  }
}
