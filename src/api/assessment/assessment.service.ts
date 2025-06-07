import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { IAssessment } from '@/database/interface-model/assessment-entity.interface';
import { IAssessmentSubCriteria } from '@/database/interface-model/assessment-sub-criteria-entity.interface';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AssessmentSubCriteriaRepository } from '../assessment-sub-criteria/assessment-sub-criteria.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { AssessmentRepository } from './assessment.repository';
import { CreateAssessmentDto } from './dto/create.dto';
import { DeleteAssessmentDto } from './dto/delete.dto';
import { AssessmentPaginationReqQuery } from './dto/query.dto';
import { UpdateAssessmentDto } from './dto/update.dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepository: AssessmentRepository,
    private readonly assessmentSubCriteriaRepository: AssessmentSubCriteriaRepository,
    private readonly subCriteriaRepository: SubCriteriaRepository,
    private readonly lecturerRepository: LecturerRepository,
    private readonly dataSource: DataSource,
  ) {}

  async Pagination(
    reqQuery: AssessmentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IAssessment>> {
    return await this.assessmentRepository.Pagination(reqQuery);
  }

  async Detail(assessmentId: string): Promise<Record<string, IAssessment>> {
    const foundAssessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId as Uuid },
      relations: [
        'assessmentSubCriteria',
        'assessmentSubCriteria.subCriteria',
        'assessmentSubCriteria.subCriteria.criteria',
        'lecturer',
      ],
    });

    if (!foundAssessment) {
      throw new NotFoundException('Assessment data not found');
    }
    return { data: foundAssessment };
  }

  async Create(req: CreateAssessmentDto): Promise<Record<string, IAssessment>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const subCriteriaIds = req.scores.map((score) => score.subCriteriaId);

    const [foundSubCriteria, foundLecturer] = await Promise.all([
      this.subCriteriaRepository.find({
        where: { id: In(subCriteriaIds) },
        select: ['id'],
      }),
      this.lecturerRepository.findOne({
        where: { id: req.lecturerId as Uuid },
      }),
    ]);
    if (foundSubCriteria.length < 1) {
      throw new NotFoundException('Sub Criteria data not found');
    }

    if (!foundLecturer) {
      throw new NotFoundException('Lecturer data not found');
    }

    const existingAssessments = await this.assessmentRepository.find({
      where: {
        lecturerId: foundLecturer.id,
        assessmentSubCriteria: {
          subCriteriaId: In(subCriteriaIds),
        },
      },
    });

    if (existingAssessments.length > 0) {
      throw new BadRequestException('Assessment data already exist');
    }

    try {
      const newAssessment =
        await this.assessmentRepository.createWithTransaction(
          queryRunner,
          foundLecturer.id,
        );

      const newAssessmentsSubCriteria = req.scores.map((score) => ({
        subCriteriaId: score.subCriteriaId,
        score: score.score,
        assessmentId: newAssessment.id,
      }));

      await this.assessmentSubCriteriaRepository.createtWithTransaction(
        queryRunner,
        newAssessmentsSubCriteria as unknown as IAssessmentSubCriteria[],
      );

      await queryRunner.commitTransaction();
      return {
        data: CreateAssessmentDto.toResponse(newAssessment) as IAssessment,
      };
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
    req: UpdateAssessmentDto,
    assessmentId: string,
  ): Promise<Record<any, IAssessment>> {
    const foundAssessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId as Uuid },
      relations: ['assessmentSubCriteria'],
    });

    if (!foundAssessment || foundAssessment.assessmentSubCriteria.length < 1) {
      throw new NotFoundException('Assessment data not found');
    }

    try {
      const existingAssessmentSub = foundAssessment.assessmentSubCriteria.map(
        (assSub) => assSub.id,
      );

      await Promise.all(
        req.scores.map(async (score) => {
          if (
            score.assessmentSubCriteriaId &&
            existingAssessmentSub.includes(score.assessmentSubCriteriaId)
          ) {
            await this.assessmentSubCriteriaRepository.update(
              score.assessmentSubCriteriaId,
              {
                subCriteriaId: score.subCriteriaId,
                score: score.score,
              },
            );
          } else {
            await this.assessmentSubCriteriaRepository.save(score);
          }
        }),
      );

      return {
        data: CreateAssessmentDto.toResponse(foundAssessment) as IAssessment,
      };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Delete(
    assessmentId: string,
    req: DeleteAssessmentDto,
  ): Promise<Record<string, IAssessment[] | IAssessment>> {
    try {
      if (Array.isArray(req.assessmentIds) && req.assessmentIds.length > 0) {
        const foundAssessments = await this.assessmentRepository.find({
          where: { id: In(req.assessmentIds) },
          relations: ['assessmentSubCriteria'],
        });
        if (foundAssessments.length < 1) {
          throw new NotFoundException('Assessment data not found');
        }
        await this.assessmentRepository.delete(req.assessmentIds);

        return {
          data: foundAssessments.map((assessment) =>
            CreateAssessmentDto.toResponse(assessment),
          ) as IAssessment[],
        };
      } else {
        const foundAssessment = await this.assessmentRepository.findOne({
          where: { id: assessmentId as Uuid },
          relations: ['assessmentSubCriteria'],
        });
        if (!foundAssessment) {
          throw new NotFoundException('Assessment data not found');
        }
        await this.assessmentRepository.delete(assessmentId);

        return {
          data: CreateAssessmentDto.toResponse(foundAssessment) as IAssessment,
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
