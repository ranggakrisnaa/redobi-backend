import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import { StudentEntity } from '@/database/entities/student.entity';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    const targetName = this.repo.metadata.targetName;
    const ALLOW_TO_SORT = [
      { name: 'full_name', alias: `${targetName}.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ];
    const query = this.repo.createQueryBuilder(targetName);

    if (reqQuery.class) {
      query.andWhere(`${targetName}.class = :class`, {
        class: reqQuery.class,
      });
    }

    if (reqQuery.major) {
      query.andWhere(`${targetName}.major = :major`, {
        major: reqQuery.major,
      });
    }

    if (reqQuery.search) {
      query.andWhere(`${targetName}.full_name ILIKE :search`, {
        search: `%${reqQuery.search}%`,
      });
    }

    if (reqQuery.tahun_masuk) {
      query.andWhere(`${targetName}.tahunMasuk = :tahunMasuk`, {
        tahunMasuk: reqQuery.tahun_masuk,
      });
    }

    const sortField = ALLOW_TO_SORT.find((sort) => sort.name === reqQuery.sort);

    if (sortField) {
      query.orderBy(sortField.alias, reqQuery.order as OrderDirectionEnum);
    } else {
      query.orderBy(`${targetName}.createdAt`, OrderDirectionEnum.Desc);
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

  async bulkCreate(data: IStudent[]): Promise<IStudent[]> {
    if (!data.length) {
      return [];
    }

    const students = this.repo.create(data);
    return await this.repo.save(students);
  }

  async bulkDelete(studentIds: string[]): Promise<void> {
    this.repo.delete({
      id: In(studentIds),
    });
  }
}
