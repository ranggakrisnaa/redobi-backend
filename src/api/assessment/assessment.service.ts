import { Uuid } from '@/common/types/common.type';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';
import { AssessmentRepository } from './assessment.repository';
import { CreateAssessmentDto } from './dto/create.dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepository: AssessmentRepository,
    private readonly subCriteriaRepository: SubCriteriaRepository,
    private readonly lecturerRepository: LecturerRepository,
  ) {}

  async Create(req: CreateAssessmentDto) {
    try {
      const [foundSubCriteria, foundLecturer, existingAssessments] =
        await Promise.all([
          this.subCriteriaRepository.find({
            where: {
              id: In(req.subCriteriaIds),
            },
          }),
          this.lecturerRepository.findOne({
            where: {
              id: req.lecturerId as Uuid,
            },
          }),
          this.assessmentRepository.find({
            where: {
              subCriteriaId: In(req.subCriteriaIds),
              lecturerId: req.lecturerId as Uuid,
            },
          }),
        ]);

      if (!foundSubCriteria.length) {
        throw new NotFoundException('Criteria data is not found.');
      }
      if (!foundLecturer) {
        throw new NotFoundException('Lecturer data is not found.');
      }
      if (existingAssessments.length > 0) {
        throw new BadRequestException('Assessment data already exists.');
      }
      if (foundSubCriteria.length !== req.scores.length) {
        throw new BadRequestException(
          'Score length must be equal to sub criteria length.',
        );
      }

      const newAssessments = [];

      for (let i = 0; i < foundSubCriteria.length; i++) {
        const assessment = await this.assessmentRepository.save({
          subCriteriaId: foundSubCriteria[i].id,
          lecturerId: foundLecturer.id,
          score: req.scores[i],
        });
        newAssessments.push(assessment);
      }

      return newAssessments.map((assessment) =>
        CreateAssessmentDto.toResponse({
          ...assessment,
          scores: assessment.score,
        }),
      );
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }
}
