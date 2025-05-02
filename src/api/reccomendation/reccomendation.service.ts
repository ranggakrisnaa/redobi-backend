import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { CriteriaRepository } from '../criteria/criteria.repository';
import { CreateReccomendationDto } from './dto/create.dto';
import { ReccomendationRepository } from './reccomendation.repository';

@Injectable()
export class ReccomendationService {
  constructor(
    private readonly reccomendationRepository: ReccomendationRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly criteriaRepository: CriteriaRepository,
  ) {}

  async Pagination() {}

  async Detail() {}

  async CreateNormalizeMatrix() {
    try {
      const allAssessments = await this.assessmentRepository.find({
        relations: [
          'assessmentSubCriteria',
          'assessmentSubCriteria.subCriteria',
          'assessmentSubCriteria.subCriteria.criteria',
        ],
        order: {
          assessmentSubCriteria: {
            assessmentId: 'ASC',
            subCriteriaId: 'ASC',
          },
        },
      });

      // 1. Kumpulkan skor per subCriteriaId beserta tipe kriterianya
      const subCriteriaScoresMap = new Map<
        number,
        { scores: number[]; type: CriteriaTypeEnum }
      >();

      for (const assessment of allAssessments) {
        for (const sub of assessment.assessmentSubCriteria) {
          const subId = sub.subCriteriaId;
          const criteriaType = sub.subCriteria.criteria.type;

          if (!subCriteriaScoresMap.has(subId)) {
            subCriteriaScoresMap.set(subId, { scores: [], type: criteriaType });
          }

          subCriteriaScoresMap.get(subId)!.scores.push(sub.score);
        }
      }

      // 2. Hitung nilai max/min berdasarkan tipe (BENEFIT/COST)
      const subCriteriaScoreMap = new Map<number, number>();

      for (const [subId, data] of subCriteriaScoresMap.entries()) {
        const { scores, type } = data;
        const value =
          type === CriteriaTypeEnum.BENEFIT
            ? Math.max(...scores)
            : Math.min(...scores);

        subCriteriaScoreMap.set(subId, value);
      }

      // 3. Normalisasi
      const result = allAssessments.map((assessment) => {
        const normalized = assessment.assessmentSubCriteria.map((sub) => {
          const criteria = sub.subCriteria.criteria;
          const refValue = subCriteriaScoreMap.get(sub.subCriteriaId) ?? 1;

          let normalizedScore = 0;
          if (criteria.type === CriteriaTypeEnum.BENEFIT) {
            normalizedScore = refValue > 0 ? sub.score / refValue : 0;
          } else if (criteria.type === CriteriaTypeEnum.COST) {
            normalizedScore = sub.score > 0 ? refValue / sub.score : 0;
          }

          return parseFloat(normalizedScore.toFixed(4));
        });

        return {
          assessmentId: assessment.id,
          lecturerId: assessment.lecturerId,
          normalized,
        };
      });

      console.log(JSON.stringify(result, null, 2));
      return result;
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }

      throw err;
    }
  }

  async Create(_req: CreateReccomendationDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = await this.reccomendationRepository.find({ where: {} });
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Update() {}

  async Delete() {}
}
