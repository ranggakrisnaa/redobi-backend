import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { OrderDirectionEnum } from '@/common/enums/sort.enum';
import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    const ALLOW_TO_SORT = [
      { name: 'full_name', alias: `${targetName}.full_name` },
      { name: 'created_at', alias: `${targetName}.createdAt` },
    ];
    const query = this.createQueryBuilder(targetName);

    if (reqQuery.search) {
      query.andWhere(`${targetName}.full_name ILIKE :search`, {
        search: `%${reqQuery.search}%`,
      });
    }

    if (reqQuery.prodi) {
      query.andWhere(`${targetName}.prodi = :prodi`, {
        prodi: reqQuery.prodi,
      });
    }

    if (reqQuery.tipe_pembimbing) {
      query.andWhere(`${targetName}.tipePembimbing = :tipePembimbing`, {
        tipePembimbing: reqQuery.tipe_pembimbing,
      });
    }

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

  async bulkCreate(data: ILecturer[]): Promise<ILecturer[]> {
    if (!data.length) {
      return [];
    }

    const lecturers = this.repo.create(data);
    return await this.repo.save(lecturers);
  }

  async bulkDelete(lecturerIds: string[]): Promise<void> {
    this.repo.softDelete({
      id: In(lecturerIds),
    });
  }
}
