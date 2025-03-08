import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum, SortEnum } from '@/common/enums/sort.enum';
import { StudentEntity } from '@/database/entities/student.entity';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentPaginationReqQuery } from './dto/query.req.dto';

@Injectable()
export class StudentRepository extends Repository<StudentEntity> {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repo: Repository<StudentEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: StudentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IStudent>> {
    const ALLOW_TO_SORT = [
      {
        name: 'name',
        alias: 'name',
      },
    ];
    const targetName = this.repo.metadata.targetName;

    const query = this.repo.createQueryBuilder(targetName);

    if (reqQuery.sort === SortEnum.Latest) {
      query.addOrderBy(`${targetName}.createdAt`, OrderDirectionEnum.Desc);
    } else if (reqQuery.sort === SortEnum.Oldest) {
      query.addOrderBy(`${targetName}.createdAt`, OrderDirectionEnum.Asc);
    } else {
      const sortField = ALLOW_TO_SORT.find(
        (sort) => sort.name === reqQuery.sort,
      );

      query.orderBy(
        sortField?.alias ?? `${targetName}.createdAt`,
        reqQuery.order as OrderDirectionEnum,
      );
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
      data: data,
      pagination: metaDto,
    };
  }

  async bulkCreate(data: IStudent[]): Promise<IStudent[]> {
    if (!data.length) {
      return [];
    }

    const students = this.repo.create(data);
    return await this.repo.save(students);
  }
}
