import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ICriteria } from '@/database/interface-model/criteria-entity.interface';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { CriteriaRepository } from './criteria.repository';
import { CreateCriteriaDto } from './dto/create.dto';
import { DeleteCriteriaDto } from './dto/delete.dto';
import { CriteriaPaginationReqQuery } from './dto/query.dto';
import { UpdateCriteriaDto } from './dto/update.dto';

@Injectable()
export class CriteriaService {
  constructor(
    private readonly criteriaRepository: CriteriaRepository,
    private readonly subCriteriaRepository: SubCriteriaRepository,
    private readonly dataSource: DataSource,
  ) {}

  async Create(req: CreateCriteriaDto): Promise<Record<string, ICriteria>> {
    const foundCriteria = await this.criteriaRepository.findOneBy({
      name: req.name,
    });
    if (foundCriteria) {
      throw new ForbiddenException('Criteria already exist');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const criteria = await this.criteriaRepository.createtWithTransaction(
        queryRunner,
        {
          name: req.name,
          weight: req.weight,
          type: req.type,
        },
      );

      let subCriteria = [];
      if (req.subCriteria && req.subCriteria.length > 0) {
        subCriteria = req.subCriteria.map((sub) => ({
          ...sub,
          criteriaId: criteria.id,
        }));

        await this.subCriteriaRepository.createtWithTransaction(
          queryRunner,
          criteria.id,
          subCriteria,
        );
      }

      await queryRunner.commitTransaction();

      return { data: CreateCriteriaDto.toResponse(criteria) as ICriteria };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();

      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async Update(
    req: UpdateCriteriaDto,
    criteriaId: number,
  ): Promise<Record<string, ICriteria>> {
    const foundCriteria = await this.criteriaRepository.findOne({
      where: { id: criteriaId },
      relations: ['subCriteria'],
    });
    if (!foundCriteria) {
      throw new NotFoundException('Criteria not found');
    }

    try {
      const updatedCriteria = await this.criteriaRepository.save({
        ...foundCriteria,
        name: req.name,
        weight: req.weight,
        type: req.type,
      });

      const existingSubCriteriaIds = foundCriteria.subCriteria.map(
        (sc) => sc.id,
      );
      const receivedSubCriteriaIds = req.subCriteria.map((sc) => sc.id);
      const toDelete = existingSubCriteriaIds.filter(
        (id) => !receivedSubCriteriaIds.includes(id),
      );
      if (toDelete.length > 0) {
        await this.subCriteriaRepository.delete(toDelete);
      }

      for (const sub of req.subCriteria) {
        if (sub.id && existingSubCriteriaIds.includes(sub.id)) {
          await this.subCriteriaRepository.update(sub.id, {
            name: sub.name,
            weight: sub.weight,
          });
        } else {
          await this.subCriteriaRepository.save({
            name: sub.name,
            weight: sub.weight,
            criteriaId: updatedCriteria.id,
          });
        }
      }
      return { data: CreateCriteriaDto.toResponse(foundCriteria) as ICriteria };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Detail(criteriaId: number): Promise<Record<string, ICriteria>> {
    const foundCriteria = await this.criteriaRepository.findOne({
      where: { id: criteriaId },
      relations: ['subCriteria'],
    });
    if (!foundCriteria) {
      throw new NotFoundException('Criteria not found');
    }
    return { data: foundCriteria };
  }

  async Pagination(
    reqQuery: CriteriaPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ICriteria>> {
    return await this.criteriaRepository.Pagination(reqQuery);
  }

  async Delete(
    criteriaId: number,
    req: DeleteCriteriaDto,
  ): Promise<Record<string, ICriteria[] | ICriteria>> {
    try {
      if (Array.isArray(req?.criteriaIds) && req.criteriaIds.length > 0) {
        const foundCriteria = await this.criteriaRepository.find({
          where: {
            id: In(req.criteriaIds),
          },
          relations: ['subCriteria'],
        });

        if (!foundCriteria.length) {
          throw new NotFoundException('Criteria not found');
        }

        await this.criteriaRepository.delete(req.criteriaIds);

        return {
          data: foundCriteria.map((criteria) =>
            CreateCriteriaDto.toResponse({
              ...criteria,
              subCriteria: criteria.subCriteria,
            }),
          ) as ICriteria[],
        };
      } else {
        const foundCriteria = await this.criteriaRepository.findOne({
          where: {
            id: criteriaId,
          },
          relations: ['subCriteria'],
        });
        if (!foundCriteria) {
          throw new NotFoundException('Criteria not found');
        }

        await this.criteriaRepository.delete(criteriaId);

        return {
          data: CreateCriteriaDto.toResponse(foundCriteria) as ICriteria,
        };
      }
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }
}
