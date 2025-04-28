import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      // const [foundSubCriteria, foundLecturer] = await Promise.all([
      //   this.subCriteriaRepository.find({
      //     where: { id: In(req.subCriteriaIds) },
      //     select: ['id'],
      //   }),
      //   this.lecturerRepository.findOne({
      //     where: { id: req.lecturerId as Uuid },
      //   }),
      // ]);
      // if (foundSubCriteria.length !== req.scores.length) {
      //   throw new BadRequestException(
      //     'Score length must be equal to sub criteria length.',
      //   );
      // }
      // if (!foundLecturer) {
      //   throw new NotFoundException('Lecturer data is not found.');
      // }
      // const existingAssessments = await this.assessmentRepository.find({
      //   where: {
      //     lecturerId: req.lecturerId as Uuid,
      //     subCriteriaId: In(req.subCriteriaIds as unknown as number[]),
      //   },
      // });
      // if (existingAssessments.length > 0) {
      //   throw new BadRequestException('Assessment data already exists.');
      // }
      // const newAssessments = foundSubCriteria.map((subCriteria, index) => ({
      //   subCriteriaId: subCriteria.id,
      //   lecturerId: foundLecturer.id,
      //   score: req.scores[index],
      // }));
      // const savedAssessments =
      //   await this.assessmentRepository.save(newAssessments);
      // return savedAssessments.map((assessment) =>
      //   CreateAssessmentDto.toResponse({
      //     ...assessment,
      //     scores: [assessment.score],
      //     subCriteriaIds: [assessment.subCriteriaId],
      //   }),
      // );
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }
}
