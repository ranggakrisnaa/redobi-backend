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

  async Detail(assesmentId: string): Promise<IAssessment> {
    const foundAssessment = await this.assessmentRepository.findOne({
      where: { id: assesmentId as Uuid },
      relations: ['assessmentSubCriteria', 'lecturer'],
    });
    if (!foundAssessment) {
      throw new NotFoundException('Assessment data not found');
    }
    return foundAssessment;
  }

  async Create(req: CreateAssessmentDto): Promise<Partial<IAssessment>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [foundSubCriteria, foundLecturer] = await Promise.all([
        this.subCriteriaRepository.find({
          where: { id: In(req.subCriteriaIds) },
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

      if (foundSubCriteria.length !== req.scores.length) {
        throw new BadRequestException(
          'Score length must be equal to sub criteria length',
        );
      }

      const existingAssessments = await this.assessmentRepository.find({
        where: {
          lecturerId: foundLecturer.id,
          assessmentSubCriteria: {
            subCriteriaId: In(req.subCriteriaIds as unknown as number[]),
          },
        },
      });

      if (existingAssessments.length > 0) {
        throw new BadRequestException('Assessment data already exist');
      }

      const newAssessment =
        await this.assessmentRepository.createWithTransaction(
          queryRunner,
          foundLecturer.id,
        );

      const newAssessmentsSubCriteria = foundSubCriteria.map(
        (subCriteria, index) => ({
          subCriteriaId: subCriteria.id,
          score: req.scores[index],
          assessmentId: newAssessment.id,
        }),
      );

      await this.assessmentSubCriteriaRepository.createtWithTransaction(
        queryRunner,
        newAssessmentsSubCriteria as IAssessmentSubCriteria[],
      );

      await queryRunner.commitTransaction();

      return CreateAssessmentDto.toResponse(newAssessment);
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

  async Update(req: UpdateAssessmentDto, assessmentId: string) {
    const foundAssessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId as Uuid },
      relations: ['assessmentSubCriteria'],
    });
    if (!foundAssessment || foundAssessment.assessmentSubCriteria.length < 1) {
      throw new NotFoundException('Assessment data not found');
    }
    if (
      foundAssessment.assessmentSubCriteria.map((data) => data.subCriteria)
        .length !== req.scores.length
    ) {
      throw new BadRequestException(
        'Score length must be equal to sub criteria length',
      );
    }

    try {
      const updateAssessmentSubCriteria =
        foundAssessment.assessmentSubCriteria.map((subCriteria, index) => ({
          id: subCriteria.id,
          subCriteriaId: subCriteria.subCriteriaId,
          assessmentId: foundAssessment.id,
          score: req.scores[index],
        }));

      await this.assessmentSubCriteriaRepository.save(
        updateAssessmentSubCriteria,
      );

      return CreateAssessmentDto.toResponse(foundAssessment);
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Delete(assessmentId: string, req: DeleteAssessmentDto) {
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

        return foundAssessments.map((assessment) =>
          CreateAssessmentDto.toResponse(assessment),
        );
      } else {
        const foundAssessment = await this.assessmentRepository.findOne({
          where: { id: assessmentId as Uuid },
          relations: ['assessmentSubCriteria'],
        });
        if (!foundAssessment) {
          throw new NotFoundException('Assessment data not found');
        }
        await this.assessmentRepository.delete(assessmentId);

        return CreateAssessmentDto.toResponse(foundAssessment);
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
