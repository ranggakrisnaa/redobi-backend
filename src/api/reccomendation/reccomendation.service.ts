import { Uuid } from '@/common/types/common.type';
import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { RankingMatricesRepository } from '../ranking-matrices/ranking-matrices.repository';
import { RankingNormalizedMatricesRepository } from '../ranking-normalized-matrices/ranking-normalized-matrices.repository';
import { StudentRepository } from '../student/student.repository';
import { ThesisKeywordRepository } from '../thesis-keyword/thesis-keyword.repository';
import { ReccomendationRepository } from './reccomendation.repository';

@Injectable()
export class ReccomendationService {
  constructor(
    private readonly reccomendationRepository: ReccomendationRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly normalizedMatrixRepository: NormalizedMatrixRepository,
    private readonly rankingNormalizedMatricesRepository: RankingNormalizedMatricesRepository,
    private readonly rankingMatricesRepository: RankingMatricesRepository,
    private readonly thesisKeywordRepository: ThesisKeywordRepository,
    private readonly studentRepository: StudentRepository,
    private readonly lecturerRepository: LecturerRepository,
  ) {}

  async Pagination() {}

  async Detail() {}

  async CreateNormalizationMatrix() {
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
          const normalized = await this.normalizedMatrixRepository.find();

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
      return {
        message: 'Matrix normalization created successfully.',
      };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }

      throw err;
    }
  }

  async NormalizationMatricesRanking() {
    try {
      const [foundMatrices, foundTotalValues] = await Promise.all([
        this.normalizedMatrixRepository.find(),
        this.normalizedMatrixRepository.findAllNormalizedMatrixWithSumTotalValue(),
      ]);

      const sortedRanking = [...foundTotalValues].sort(
        (a, b) => Number(b.finalScore) - Number(a.finalScore),
      );

      const foundAllRankings = await this.rankingMatricesRepository.find();

      const savedRankingMap = new Map<string, { id: string }>();
      for (let i = 0; i < sortedRanking.length; i++) {
        const item = sortedRanking[i];
        const alreadyExists = foundAllRankings.some(
          (existing) =>
            existing.lecturerId === item.lecturerId ||
            existing.finalScore === item.finalScore,
        );
        if (alreadyExists) continue;

        const ranking = await this.rankingMatricesRepository.save({
          lecturerId: item.lecturerId,
          finalScore: item.finalScore,
          rank: i + 1,
        });

        savedRankingMap.set(item.lecturerId, ranking);
      }

      for (const normalized of foundMatrices) {
        const rankingMatrix = savedRankingMap.get(normalized.lecturerId);
        if (!rankingMatrix) continue;

        await this.rankingNormalizedMatricesRepository.save({
          normalizedMatricesId: normalized.id,
          rankingMatricesId: rankingMatrix.id,
        });
      }
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }

    return {
      message: 'Matrix normalization created successfully.',
    };
  }

  async Create() {
    try {
      const [foundAllRankings, foundAllStudents] = await Promise.all([
        this.rankingMatricesRepository.find({
          relations: ['lecturer'],
        }),
        this.studentRepository.find(),
      ]);

      const studentMapWithThesisValue = new Map<
        string,
        { studentId: string; major: string; value: number }
      >();
      for (const student of foundAllStudents) {
        const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
          where: {
            category: student.major as unknown as ThesisKeywordCategoryEnum,
          },
          relations: ['keyword'],
        });
        const keywordArray = student.judulSkripsi.toLowerCase().split(' ');

        const filteredStudentThesisKeyword = keywordArray.filter(
          (key) =>
            foundThesisKeyword &&
            foundThesisKeyword.keyword.some(
              (name) => name.name.toLowerCase() === key.toLowerCase(),
            ),
        );
        const value = filteredStudentThesisKeyword.length * 10;

        studentMapWithThesisValue.set(student.id, {
          studentId: student.id,
          major: student.major,
          value,
        });
      }

      const ranking = Array.from(studentMapWithThesisValue.entries())
        .sort((a, b) => b[1].value - a[1].value)
        .map(([studentId, value], index) => ({
          studentId,
          major: value.major,
          value: value.value,
          rank: index + 1,
        }));

      const filteredRanking = ranking.filter(
        (value) =>
          value.major == ThesisKeywordCategoryEnum.REKAYASA_PERANGKAT_LUNAK,
      );

      const numberOfLecturers = foundAllRankings.length;
      const studentsPerLecturer = Math.ceil(
        filteredRanking.length / numberOfLecturers,
      );

      const pembimbingTypes = [
        TipePembimbingEnum.PEMBIMBING_SATU,
        TipePembimbingEnum.PEMBIMBING_DUA,
      ];

      for (const student of filteredRanking) {
        for (const tipePembimbing of pembimbingTypes) {
          let isAssigned = false;

          for (const lecturer of foundAllRankings.filter(
            (data) => data.lecturer.tipePembimbing === tipePembimbing,
          )) {
            if (isAssigned) break;

            const currentLecturerStudentsCount =
              await this.reccomendationRepository.count({
                where: { lecturerId: lecturer.lecturer.id },
              });

            if (currentLecturerStudentsCount < studentsPerLecturer) {
              const existingRecommendation =
                await this.reccomendationRepository.findOne({
                  where: {
                    studentId: student.studentId as Uuid,
                    lecturerId: lecturer.lecturer.id,
                  },
                });

              if (!existingRecommendation) {
                await this.reccomendationRepository.save({
                  studentId: student.studentId,
                  lecturerId: lecturer.lecturer.id,
                  reccomendationScore: lecturer.finalScore,
                });

                isAssigned = true;
              }
            }
          }
        }
      }

      const lecturerIds = foundAllRankings.map(
        (ranking) => ranking.lecturer.id,
      );

      for (const lecturerId of lecturerIds) {
        const actualStudentCount = await this.reccomendationRepository.count({
          where: { lecturerId: lecturerId },
        });

        await this.lecturerRepository.update(lecturerId, {
          jumlahBimbingan: actualStudentCount,
        });
      }
    } catch (err: unknown) {
      console.log(err);

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
