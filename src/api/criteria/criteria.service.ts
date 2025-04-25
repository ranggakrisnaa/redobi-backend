import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ICriteria } from '@/database/interface-model/criteria-entity.interface';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
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
  ) {}

  async Create(req: CreateCriteriaDto): Promise<Partial<ICriteria>> {
    const foundCriteria = await this.criteriaRepository.findOneBy({
      name: req.name,
    });
    if (foundCriteria) {
      throw new ForbiddenException('Criteria data already exist.');
    }
    try {
      const criteria = await this.criteriaRepository.save({
        name: req.name,
        weight: req.weight,
        type: req.type,
      });

      let subCriteria = [];
      if (req.subCriteria && req.subCriteria.length > 0) {
        subCriteria = req.subCriteria.map((sub) => ({
          ...sub,
          criteriaId: criteria.id,
        }));

        await this.subCriteriaRepository.save(subCriteria);
      }

      const fullEntity = {
        ...criteria,
        subCriteria,
      };

      return CreateCriteriaDto.toResponse(fullEntity) as ICriteria;
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Update(req: UpdateCriteriaDto, criteriaId: number): Promise<ICriteria> {
    const foundCriteria = await this.criteriaRepository.findOne({
      where: { id: criteriaId },
      relations: ['subCriteria'],
    });
    if (!foundCriteria) {
      throw new NotFoundException('Criteria data is not exist.');
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

      return CreateCriteriaDto.toResponse({
        ...req,
        id: foundCriteria.id,
      }) as ICriteria;
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Detail(criteriaId: number): Promise<ICriteria> {
    const foundCriteria = await this.criteriaRepository.findOne({
      where: { id: criteriaId },
      relations: ['subCriteria'],
    });
    if (!foundCriteria) {
      throw new NotFoundException('Criteria data is not found.');
    }
    return CreateCriteriaDto.toResponse(foundCriteria) as ICriteria;
  }

  async Pagination(
    reqQuery: CriteriaPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ICriteria>> {
    return await this.criteriaRepository.Pagination(reqQuery);
  }

  async Delete(
    criteriaId: number,
    req: DeleteCriteriaDto,
  ): Promise<Partial<ICriteria> | Partial<ICriteria>[]> {
    try {
      if (Array.isArray(req?.criteriaIds) && req.criteriaIds.length > 0) {
        const foundCriteria = await this.criteriaRepository.find({
          where: {
            id: In(req.criteriaIds),
          },
          relations: ['subCriteria'],
        });

        if (!foundCriteria.length) {
          throw new NotFoundException('Criteria data is not found.');
        }

        await this.subCriteriaRepository.delete({
          criteriaId: In(req.criteriaIds),
        });

        await this.criteriaRepository.delete(req.criteriaIds);

        return foundCriteria.map((criteria) =>
          CreateCriteriaDto.toResponse({
            ...criteria,
            subCriteria: criteria.subCriteria,
          }),
        ) as ICriteria[];
      } else {
        const foundCriteria = await this.criteriaRepository.findOne({
          where: {
            id: criteriaId,
          },
          relations: ['subCriteria'],
        });
        if (!foundCriteria) {
          throw new NotFoundException('Criteria data is not found.');
        }

        await this.subCriteriaRepository.delete({
          criteriaId,
        });

        await this.criteriaRepository.delete(criteriaId);

        return CreateCriteriaDto.toResponse(foundCriteria) as ICriteria;
      }
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unexpected error',
      );
    }
  }
}
