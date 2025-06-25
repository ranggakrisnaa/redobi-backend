import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { StudentEntity } from '@/database/entities/student.entity';
import { IStudent } from '@/database/interface-model/student-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
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
    const query = this.repo.createQueryBuilder(targetName);

    this.applyFilters(query, reqQuery, targetName);

    const sortField = [
      { name: 'full_name', alias: `${targetName}.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ].find((sort) => sort.name === reqQuery.sort);

    if (sortField) {
      query.orderBy(sortField.alias, toOrderEnum(reqQuery.order));
    } else {
      query.orderBy(`${targetName}.createdAt`, toOrderEnum(reqQuery.order));
    }

    query.limit(reqQuery.limit).offset(reqQuery.offset);

    const [data, total] = await query.getManyAndCount();

    const pagination = plainToInstance(
      OffsetPaginationDto,
      new OffsetPaginationDto(total, reqQuery),
      { excludeExtraneousValues: true },
    );

    return {
      data,
      pagination: pagination,
    };
  }

  private applyFilters(
    query: SelectQueryBuilder<StudentEntity>,
    req: StudentPaginationReqQuery,
    targetName: string,
  ) {
    if (req.class) {
      query.andWhere(`${targetName}.class = :class`, {
        class: req.class,
      });
    }

    if (req.major) {
      query.andWhere(`${targetName}.major = :major`, {
        major: req.major,
      });
    }

    if (req.search) {
      query.andWhere(`${targetName}.full_name ILIKE :search`, {
        search: `%${req.search}%`,
      });
    }

    if (req.tahun_masuk) {
      query.andWhere(`${targetName}.tahunMasuk = :tahunMasuk`, {
        tahunMasuk: req.tahun_masuk,
      });
    }
  }

  async bulkCreate(data: IStudent[]): Promise<IStudent[]> {
    if (!data.length) {
      return [];
    }

    const students = this.repo.create(data);
    return await this.repo.save(students);
  }

  async bulkDelete(studentIds: string[]): Promise<void> {
    await this.repo.delete({
      id: In(studentIds),
    });
  }

  async getStudentGuidanceCount(): Promise<number> {
    const targetName = this.repo.metadata.targetName;
    return await this.repo
      .createQueryBuilder(targetName)
      .leftJoin(`${targetName}.recommendation`, 'recommendation')
      .where('recommendation.id IS NOT NULL')
      .getCount();
  }

  async getMajorTotal() {
    const targetName = this.repo.metadata.targetName;

    const query = this.repo
      .createQueryBuilder(targetName)
      .select([
        `${targetName}.major as major`,
        `COUNT(${targetName}.id) as major_count`,
      ])
      .groupBy(`${targetName}.major`)
      .orderBy('major_count', 'DESC');

    const result = await query.getRawMany();

    return result.map((row) => ({
      major: row.major,
      major_count: parseInt(row.major_count, 10),
    }));
  }
}
