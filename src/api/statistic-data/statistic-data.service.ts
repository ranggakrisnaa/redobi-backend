import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { StudentRepository } from '../student/student.repository';
import { SubCriteriaRepository } from '../sub-criteria/sub-criteria.repository';

@Injectable()
export class StatisticDataService {
  constructor(
    private readonly lecturerRepository: LecturerRepository,
    private readonly studentRepository: StudentRepository,
    private readonly criteriaRepository: CriteriaRepository,
    private readonly subCriteriaRepository: SubCriteriaRepository,
  ) {}

  async GetAllStatistics() {
    try {
      const countStudentGuidance =
        await this.studentRepository.getStudentGuidanceCount();
      const countStudentTotal = await this.studentRepository.count();
      const countStudentUnguidance = countStudentTotal - countStudentGuidance;

      const countCriteriaTotal = await this.criteriaRepository.count();
      const countSubCriteriaTotal = await this.subCriteriaRepository.count();
      const countLecturerTotal = await this.lecturerRepository.count();

      const lecturerGuidance =
        await this.lecturerRepository.getTopLecturersByGuidance();

      const getMajorTotal = await this.studentRepository.getMajorTotal();

      const calculatePercentage = (value: number, total: number): number => {
        return total > 0 ? parseFloat(((value / total) * 100).toFixed(2)) : 0;
      };

      return {
        data: {
          guidanceProgress: {
            countStudentGuidance,
            countStudentUnguidance,
            percentageGuidance: calculatePercentage(
              countStudentGuidance,
              countStudentTotal,
            ),
            percentageUnguidance: calculatePercentage(
              countStudentUnguidance,
              countStudentTotal,
            ),
          },
          countTotalData: {
            countStudentTotal,
            countLecturerTotal,
            countCriteriaTotal,
            countSubCriteriaTotal,
          },
          lecturerGuidance,
          getMajorTotal: getMajorTotal.map((row) => ({
            major: row.major,
            majorCount: calculatePercentage(row.major_count, countStudentTotal),
          })),
        },
      };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Failed to get statistics',
      );
    }
  }
}
