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
    const idQuery = this.createQueryBuilder(targetName)
      .select(`${targetName}.id`)
      .leftJoin(`${targetName}.lecturer`, 'lecturer');

    this.applyFilters(idQuery, reqQuery, targetName);

    idQuery.limit(reqQuery.limit).offset(reqQuery.offset);

    const ids = await idQuery.getRawMany();
    const assessmentIds = ids.map((row) => row[`${targetName}_id`]);

    const assessmentQuery = this.createQueryBuilder(targetName)
      .leftJoinAndSelect(`${targetName}.lecturer`, 'lecturer')
      .leftJoinAndSelect(
        `${targetName}.assessmentSubCriteria`,
        'assessmentSubCriteria',
      )
      .leftJoinAndSelect('assessmentSubCriteria.subCriteria', 'subCriteria')
      .leftJoinAndSelect('subCriteria.criteria', 'criteria')
      .whereInIds(assessmentIds);

    const sortField = [
      { name: 'lecturerName', alias: `lecturer.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);
    if (sortField) {
      idQuery.orderBy(sortField.alias, reqQuery.order as OrderDirectionEnum);
    } else {
      idQuery.orderBy(`${targetName}.createdAt`, OrderDirectionEnum.Asc);
    }

    const [data, total] = await assessmentQuery.getManyAndCount();

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    targetName: string,
  ) {
    if (req.search) {
      query.where(`lecturer.full_name ILIKE :search`, {
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
