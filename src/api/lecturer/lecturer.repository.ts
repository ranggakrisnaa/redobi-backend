import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { toOrderEnum } from '@/utils/util';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { LecturerPaginationReqQuery } from './dto/query.dto';

export class LecturerRepository extends Repository<LecturerEntity> {
  constructor(
    @InjectRepository(LecturerEntity)
    private readonly repo: Repository<LecturerEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async Pagination(
    reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ILecturer>> {
    const targetName = this.repo.metadata.targetName;
    const query = this.createQueryBuilder(targetName);

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

    return { data, pagination };
  }

  private applyFilters(
    query: SelectQueryBuilder<LecturerEntity>,
    req: LecturerPaginationReqQuery,
    targetName: string,
  ) {
    if (req.search) {
      query.andWhere(`${targetName}.full_name ILIKE :search`, {
        search: `%${req.search}%`,
      });
    }

    if (req.prodi) {
      query.andWhere(`${targetName}.prodi = :prodi`, { prodi: req.prodi });
    }

    if (req.tipe_pembimbing) {
      query.andWhere(`${targetName}.tipePembimbing = :tipePembimbing`, {
        tipePembimbing: req.tipe_pembimbing,
      });
    }

    return query;
  }

  async bulkCreate(data: ILecturer[]): Promise<ILecturer[]> {
    if (!data.length) {
      return [];
    }

    const lecturers = this.repo.create(data);
    return await this.repo.save(lecturers);
  }

  async bulkDelete(lecturerIds: string[]): Promise<void> {
    this.repo.delete({
      id: In(lecturerIds),
    });
  }
}
