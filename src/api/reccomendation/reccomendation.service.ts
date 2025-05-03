import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { CreateReccomendationDto } from './dto/create.dto';
import { ReccomendationRepository } from './reccomendation.repository';

@Injectable()
export class ReccomendationService {
  constructor(
    private readonly reccomendationRepository: ReccomendationRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly normalizedMatrixRepository: NormalizedMatrixRepository,
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

      const subCriteriaScoresMap = new Map<
        number,
        { scores: number[]; type: CriteriaTypeEnum }
      >();

      let foundNormalize: INormalizedMatrices[] = [];
      for (const assessment of allAssessments) {
        for (const sub of assessment.assessmentSubCriteria) {
          const normalized = await this.normalizedMatrixRepository.find({
            where: {
              criteriaId: sub.subCriteria.criteriaId,
              lecturerId: assessment.lecturerId,
            },
          });

          foundNormalize.push(...normalized);

          const subId = sub.subCriteriaId;
          const criteriaType = sub.subCriteria.criteria.type;

          if (!subCriteriaScoresMap.has(subId)) {
            subCriteriaScoresMap.set(subId, { scores: [], type: criteriaType });
          }

          subCriteriaScoresMap.get(subId)!.scores.push(sub.score);
        }
      }

      const normalizedMatrixMap = new Map<string, INormalizedMatrices>();
      for (const matrix of foundNormalize) {
        const key = `${matrix.lecturerId}-${matrix.criteriaId}`;
        normalizedMatrixMap.set(key, matrix);
      }

      const subCriteriaScoreMap = new Map<number, number>();
      for (const [subId, data] of subCriteriaScoresMap.entries()) {
        const { scores, type } = data;
        const value =
          type === CriteriaTypeEnum.BENEFIT
            ? Math.max(...scores)
            : Math.min(...scores);

        subCriteriaScoreMap.set(subId, value);
      }

      const entities = allAssessments.flatMap((assessment) => {
        return assessment.assessmentSubCriteria.map((sub) => {
          const criteria = sub.subCriteria.criteria;
          const refValue = subCriteriaScoreMap.get(sub.subCriteriaId) ?? 1;

          let normalizedScore = 0;
          if (criteria.type === CriteriaTypeEnum.BENEFIT) {
            normalizedScore = refValue > 0 ? sub.score / refValue : 0;
          } else if (criteria.type === CriteriaTypeEnum.COST) {
            normalizedScore = sub.score > 0 ? refValue / sub.score : 0;
          }

          return {
            criteriaId: criteria.id,
            lecturerId: assessment.lecturerId,
            normalizedValue: normalizedScore,
          };
        });
      });

      const groupedMap = new Map<
        string,
        { lecturerId: string; criteriaId: number; totalNormalizedValue: number }
      >();

      for (const entry of entities) {
        const key = `${entry.lecturerId}-${entry.criteriaId}`;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            lecturerId: entry.lecturerId,
            criteriaId: entry.criteriaId,
            totalNormalizedValue: 0,
          });
        }

        groupedMap.get(key)!.totalNormalizedValue += entry.normalizedValue;
      }

      const result = Array.from(groupedMap.values()).map((item) => ({
        lecturerId: item.lecturerId,
        criteriaId: item.criteriaId,
        normalizedValue: item.totalNormalizedValue,
      }));

      for (const data of result) {
        const existingRecord = normalizedMatrixMap.get(
          `${data.lecturerId}-${data.criteriaId}`,
        );

        if (existingRecord) {
          await this.normalizedMatrixRepository.update(existingRecord.id, {
            normalizedValue: data.normalizedValue,
          });
        } else {
          await this.normalizedMatrixRepository.save(data);
        }
      }
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }

      throw err;
    }
  }

  async;

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
