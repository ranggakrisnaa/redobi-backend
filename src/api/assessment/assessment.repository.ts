import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import { Uuid } from '@/common/types/common.type';
import { AssessmentEntity } from '@/database/entities/assesment.entity';
import { IAssessment } from '@/database/interface-model/assessment-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { AssessmentPaginationReqQuery } from './dto/query.dto';

export class AssessmentRepository extends Repository<AssessmentEntity> {
  constructor(
    @InjectRepository(AssessmentEntity)
    private readonly repo: Repository<AssessmentEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: AssessmentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IAssessment>> {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer')
      .leftJoinAndSelect(
        `${targetName}.assessmentSubCriteria`,
        'assessmentSubCriteria',
      );

    this.applyFilters(query, reqQuery, targetName);
    const sortField = [
      { name: 'name', alias: `${targetName}.name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      query.orderBy(sortField.alias, reqQuery.order as OrderDirectionEnum);
    } else {
      query.orderBy(`${targetName}.createdAt`, OrderDirectionEnum.Asc);
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
    query: SelectQueryBuilder<AssessmentEntity>,
    req: AssessmentPaginationReqQuery,
    targetName: string,
  ) {
    if (req.search) {
      query.where(`${targetName}.name ILIKE :search`, {
        search: `%${req.search}%`,
      });
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    lecturerId: string,
  ): Promise<Partial<IAssessment>> {
    const assessment = this.repo.create({
      lecturerId: lecturerId as Uuid,
    });

    return await queryRunner.manager.save(AssessmentEntity, assessment);
  }
}
