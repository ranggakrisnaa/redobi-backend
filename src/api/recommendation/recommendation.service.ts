import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RecommendationStageEnum } from '@/common/enums/recommendation-stage.enum';
import { Uuid } from '@/common/types/common.type';
import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import { StorageFileType } from '@/database/enums/file-type.enum';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '@/database/interface-model/ranking-matrices-entity.interface';
import { IRecommendation } from '@/database/interface-model/recommendation-entity.interface';
import { SupabaseService } from '@/libs/supabase/supabase.service';
import { getRelativeFilePath } from '@/utils/util';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Like } from 'typeorm';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { DeleteNormalizedMatrix } from '../normalized-matrix/dto/delete.dto';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { DeleteRankingMatrix } from '../ranking-matrices/dto/delete.dto';
import { RankingMatricesRepository } from '../ranking-matrices/ranking-matrices.repository';
import { RankingNormalizedMatricesRepository } from '../ranking-normalized-matrices/ranking-normalized-matrices.repository';
import { StorageUrlRepository } from '../storage-url/storage-url.repository';
import { StudentRepository } from '../student/student.repository';
import { ThesisKeywordRepository } from '../thesis-keyword/thesis-keyword.repository';
import { DeleteRecommendationDto } from './dto/delete.dto';
import { RecommendationPaginationReqQuery } from './dto/query.dto';
import { UpdateRecommendationDto } from './dto/update.dto';
import { RecommendationRepository } from './recommendation.repository';
const PDFDocument = require('pdfkit');
@Injectable()
export class RecommendationService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly normalizedMatrixRepository: NormalizedMatrixRepository,
    private readonly rankingNormalizedMatricesRepository: RankingNormalizedMatricesRepository,
    private readonly rankingMatricesRepository: RankingMatricesRepository,
    private readonly thesisKeywordRepository: ThesisKeywordRepository,
    private readonly studentRepository: StudentRepository,
    private readonly lecturerRepository: LecturerRepository,
    private readonly supabaseService: SupabaseService,
    private readonly storageUrlRepository: StorageUrlRepository,
    private dataSource: DataSource,
  ) {}

  async Pagination(
    reqQuery: RecommendationPaginationReqQuery,
  ): Promise<
    OffsetPaginatedDto<INormalizedMatrices | IRankingMatrices | IRecommendation>
  > {
    try {
      let responseData: OffsetPaginatedDto<
        INormalizedMatrices | IRankingMatrices | IRecommendation
      >;
      switch (reqQuery.stage) {
        case RecommendationStageEnum.NORMALIZATION:
          responseData =
            await this.normalizedMatrixRepository.Pagination(reqQuery);
          break;
        case RecommendationStageEnum.RANKING_NORMALIZATION:
          responseData =
            await this.rankingMatricesRepository.Pagination(reqQuery);
          break;
        case RecommendationStageEnum.RECCOMENDATION:
          responseData =
            await this.recommendationRepository.Pagination(reqQuery);
          break;
        default:
          console.log('Stage Reccomendation not found');
          break;
      }

      return responseData;
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async CreateNormalizationMatrix(): Promise<Record<string, string>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const foundAllNormalization =
        await this.normalizedMatrixRepository.find();
      if (foundAllNormalization.length) {
        const normalizedIds = foundAllNormalization.map((n) => n.id);

        await this.rankingNormalizedMatricesRepository.delete({
          normalizedMatricesId: In(normalizedIds),
        });

        await this.normalizedMatrixRepository.delete(normalizedIds);
      }

      const allAssessments = await this.assessmentRepository.find({
        relations: [
          'assessmentSubCriteria',
          'assessmentSubCriteria.subCriteria',
          'assessmentSubCriteria.subCriteria.criteria',
          'lecturer',
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

      const lecturersToUpdate = [];

      for (const assessment of allAssessments) {
        if (!assessment.lecturer.tipePembimbing) {
          const hasValidLinear = assessment.assessmentSubCriteria.some(
            (sub) => sub.subCriteria.name == 'Linear' && sub.score > 0,
          );
          const hasValidAsistenAhli = assessment.assessmentSubCriteria.some(
            (sub) => sub.subCriteria.name == 'Asisten Ahli' && sub.score > 0,
          );

          const tipe =
            hasValidLinear && hasValidAsistenAhli
              ? TipePembimbingEnum.PEMBIMBING_SATU
              : TipePembimbingEnum.PEMBIMBING_DUA;

          lecturersToUpdate.push({
            id: assessment.lecturerId,
            tipePembimbing: tipe,
          });
        }

        for (const sub of assessment.assessmentSubCriteria) {
          const subId = sub.subCriteriaId;
          const criteriaType = sub.subCriteria.criteria.type;

          if (!subCriteriaScoresMap.has(subId)) {
            subCriteriaScoresMap.set(subId, {
              scores: [],
              type: criteriaType,
            });
          }

          subCriteriaScoresMap.get(subId).scores.push(sub.score);
        }
      }

      if (lecturersToUpdate.length > 0) {
        await queryRunner.manager.save(
          this.lecturerRepository.metadata.target,
          lecturersToUpdate,
        );
      }

      const subCriteriaRefMap = new Map<number, number>();
      for (const [subId, data] of subCriteriaScoresMap.entries()) {
        const { scores, type } = data;
        const value =
          type == CriteriaTypeEnum.BENEFIT
            ? Math.max(...scores)
            : Math.min(...scores);
        subCriteriaRefMap.set(subId, value);
      }

      const groupedNormalizedValues = new Map<string, number[]>();
      const entryToGroupKey = new Map<
        string,
        { lecturerId: string; criteriaId: number }
      >();

      for (const assessment of allAssessments) {
        for (const sub of assessment.assessmentSubCriteria) {
          const criteria = sub.subCriteria.criteria;
          const refValue = subCriteriaRefMap.get(sub.subCriteriaId) || 1;
          const key = `${assessment.lecturerId}-${criteria.id}`;

          let normalizedScore = 0;
          if (criteria.type === CriteriaTypeEnum.BENEFIT) {
            normalizedScore = refValue > 0 ? sub.score / refValue : 0;
          } else {
            normalizedScore = sub.score > 0 ? refValue / sub.score : 0;
          }

          if (!groupedNormalizedValues.has(key)) {
            groupedNormalizedValues.set(key, []);
          }
          groupedNormalizedValues.get(key).push(normalizedScore);

          entryToGroupKey.set(key, {
            lecturerId: assessment.lecturerId,
            criteriaId: criteria.id,
          });
        }
      }

      const bulkInsertData = [];

      for (const [key, scoreList] of groupedNormalizedValues.entries()) {
        const { lecturerId, criteriaId } = entryToGroupKey.get(key);
        const avgScore =
          scoreList.reduce((acc, val) => acc + val, 0) / scoreList.length;

        bulkInsertData.push({
          lecturerId,
          criteriaId,
          normalizedValue: avgScore,
        });
      }

      if (bulkInsertData.length > 0) {
        await queryRunner.manager.insert(
          this.normalizedMatrixRepository.metadata.target,
          bulkInsertData,
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Matrix normalization created successfully.',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();

      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async NormalizationMatrixRanking(): Promise<Record<string, string>> {
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
        const existing = foundAllRankings.find(
          (r) => r.lecturerId === item.lecturerId,
        );

        let ranking: IRankingMatrices;
        if (existing) {
          ranking = await this.rankingMatricesRepository.save({
            ...existing,
            finalScore: item.finalScore,
            rank: i + 1,
          });
        } else {
          ranking = await this.rankingMatricesRepository.save({
            lecturerId: item.lecturerId,
            finalScore: item.finalScore,
            rank: i + 1,
          });
        }

        savedRankingMap.set(item.lecturerId, ranking);
      }

      await this.rankingNormalizedMatricesRepository.clear();

      for (const normalized of foundMatrices) {
        const rankingMatrix = savedRankingMap.get(normalized.lecturerId);
        if (!rankingMatrix) continue;

        await this.rankingNormalizedMatricesRepository.save({
          normalizedMatricesId: normalized.id,
          rankingMatricesId: rankingMatrix.id,
        });
      }

      return {
        message: 'Matrix normalization ranking updated successfully.',
      };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async CreateRecommendation(): Promise<Record<string, string>> {
    try {
      const [foundAllRankings, foundAllStudents] = await Promise.all([
        this.rankingMatricesRepository.find({ relations: ['lecturer'] }),
        this.studentRepository.find(),
      ]);

      const studentMapWithThesisValue = new Map<
        string,
        { studentId: string; major: string; value: number }
      >();

      // Calculate thesis keyword matching scores for students
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

      const majors = [
        ThesisKeywordCategoryEnum.REKAYASA_PERANGKAT_LUNAK,
        ThesisKeywordCategoryEnum.SISTEM_CERDAS,
        ThesisKeywordCategoryEnum.MULTIMEDIA,
      ];

      await this.recommendationRepository.delete({});

      for (const major of majors) {
        const filteredRanking = ranking.filter(
          (value) => value.major === major,
        );

        if (filteredRanking.length === 0) continue;

        const allLecturers = foundAllRankings.map(
          (ranking) => ranking.lecturer,
        );

        const pembimbing1Lecturers = allLecturers.filter(
          (lecturer) =>
            lecturer.tipePembimbing === TipePembimbingEnum.PEMBIMBING_SATU,
        );

        const pembimbing2Lecturers = allLecturers.filter(
          (lecturer) =>
            lecturer.tipePembimbing === TipePembimbingEnum.PEMBIMBING_DUA,
        );

        const lecturerRankingMap = new Map();
        foundAllRankings.forEach((ranking) => {
          lecturerRankingMap.set(ranking.lecturer.id, ranking.finalScore || 0);
        });

        pembimbing1Lecturers.sort(
          (a, b) =>
            (lecturerRankingMap.get(b.id) || 0) -
            (lecturerRankingMap.get(a.id) || 0),
        );
        pembimbing2Lecturers.sort(
          (a, b) =>
            (lecturerRankingMap.get(b.id) || 0) -
            (lecturerRankingMap.get(a.id) || 0),
        );

        const lecturerAssignments = new Map<string, number>();

        [...pembimbing1Lecturers, ...pembimbing2Lecturers].forEach(
          (lecturer) => {
            lecturerAssignments.set(lecturer.id, 0);
          },
        );

        const maxStudentsPerPembimbing1 =
          pembimbing1Lecturers.length > 0
            ? Math.ceil(filteredRanking.length / pembimbing1Lecturers.length)
            : 0;
        const maxStudentsPerPembimbing2 =
          pembimbing2Lecturers.length > 0
            ? Math.ceil(filteredRanking.length / pembimbing2Lecturers.length)
            : 0;

        for (const student of filteredRanking) {
          let assigned = false;

          for (const lecturer of pembimbing1Lecturers) {
            const currentCount = lecturerAssignments.get(lecturer.id) || 0;

            if (currentCount < maxStudentsPerPembimbing1) {
              await this.recommendationRepository.save({
                studentId: student.studentId,
                lecturerId: lecturer.id,
                recommendationScore: lecturerRankingMap.get(lecturer.id) || 0,
                position: TipePembimbingEnum.PEMBIMBING_SATU,
              });

              lecturerAssignments.set(lecturer.id, currentCount + 1);
              assigned = true;
              break;
            }
          }

          if (!assigned && pembimbing1Lecturers.length > 0) {
            const leastLoadedLecturer = pembimbing1Lecturers.reduce(
              (prev, curr) => {
                const prevCount = lecturerAssignments.get(prev.id) || 0;
                const currCount = lecturerAssignments.get(curr.id) || 0;
                return prevCount <= currCount ? prev : curr;
              },
            );

            await this.recommendationRepository.save({
              studentId: student.studentId,
              lecturerId: leastLoadedLecturer.id,
              recommendationScore:
                lecturerRankingMap.get(leastLoadedLecturer.id) || 0,
              position: TipePembimbingEnum.PEMBIMBING_SATU,
            });

            const currentCount =
              lecturerAssignments.get(leastLoadedLecturer.id) || 0;
            lecturerAssignments.set(leastLoadedLecturer.id, currentCount + 1);
          }
        }

        pembimbing2Lecturers.forEach((lecturer) => {
          lecturerAssignments.set(lecturer.id, 0);
        });

        for (const student of filteredRanking) {
          let assigned = false;

          for (const lecturer of pembimbing2Lecturers) {
            const currentCount = lecturerAssignments.get(lecturer.id) || 0;

            if (currentCount < maxStudentsPerPembimbing2) {
              await this.recommendationRepository.save({
                studentId: student.studentId,
                lecturerId: lecturer.id,
                recommendationScore: lecturerRankingMap.get(lecturer.id) || 0,
                position: TipePembimbingEnum.PEMBIMBING_DUA,
              });

              lecturerAssignments.set(lecturer.id, currentCount + 1);
              assigned = true;
              break;
            }
          }

          if (!assigned && pembimbing2Lecturers.length > 0) {
            const leastLoadedLecturer = pembimbing2Lecturers.reduce(
              (prev, curr) => {
                const prevCount = lecturerAssignments.get(prev.id) || 0;
                const currCount = lecturerAssignments.get(curr.id) || 0;
                return prevCount <= currCount ? prev : curr;
              },
            );

            await this.recommendationRepository.save({
              studentId: student.studentId,
              lecturerId: leastLoadedLecturer.id,
              recommendationScore:
                lecturerRankingMap.get(leastLoadedLecturer.id) || 0,
              position: TipePembimbingEnum.PEMBIMBING_DUA,
            });

            const currentCount =
              lecturerAssignments.get(leastLoadedLecturer.id) || 0;
            lecturerAssignments.set(leastLoadedLecturer.id, currentCount + 1);
          }
        }
      }

      const lecturerIds = foundAllRankings.map(
        (ranking) => ranking.lecturer.id,
      );

      for (const lecturerId of lecturerIds) {
        const actualStudentCount = await this.recommendationRepository.count({
          where: { lecturerId },
        });

        await this.lecturerRepository.update(lecturerId, {
          jumlahBimbingan: actualStudentCount,
        });
      }

      return {
        message: 'Recommendation created successfully for all majors.',
      };
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async UpdateRecommendation(
    recommendationId: string,
    req: UpdateRecommendationDto,
  ): Promise<Record<string, IRecommendation | IRecommendation[]>> {
    try {
      if (!recommendationId) {
        const { recommendationIds, lecturerIds, studentIds } = req;

        if (
          !Array.isArray(recommendationIds) ||
          !Array.isArray(lecturerIds) ||
          !Array.isArray(studentIds) ||
          recommendationIds.length !== lecturerIds.length ||
          recommendationIds.length !== studentIds.length
        ) {
          throw new BadRequestException(
            'Recommendation IDs, Lecturer IDs, and Student IDs are required and must have the same length.',
          );
        }

        const foundRecommendations = await this.recommendationRepository.find({
          where: {
            id: In(recommendationIds),
          },
        });

        if (!foundRecommendations.length) {
          throw new NotFoundException('Recommendations not found');
        }

        const mappedRecommendations = await Promise.all(
          foundRecommendations.map(async (recommendation) => {
            const index = recommendationIds.indexOf(recommendation.id);
            if (index === -1) return recommendation;
            const foundRankingMatrix =
              await this.rankingMatricesRepository.findOne({
                where: { lecturerId: lecturerIds[index] as Uuid },
              });

            return {
              ...recommendation,
              lecturerId: lecturerIds[index],
              studentId: studentIds[index],
              recommendationScore: foundRankingMatrix?.finalScore
                ? foundRankingMatrix?.finalScore
                : 0,
            };
          }),
        );

        const updated = await this.recommendationRepository.save(
          mappedRecommendations,
        );

        return {
          data: updated.map((data) =>
            UpdateRecommendationDto.toResponse({
              id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as IRecommendation[],
        };
      } else {
        const foundReccomendation = await this.recommendationRepository.findOne(
          { where: { id: recommendationId as Uuid } },
        );
        if (!foundReccomendation) {
          throw new NotFoundException('Reccomendation not found');
        }

        foundReccomendation.lecturerId = req.lecturerIds[0] as Uuid;
        foundReccomendation.studentId = req.studentIds[0] as Uuid;

        const updated =
          await this.recommendationRepository.save(foundReccomendation);

        return {
          data: UpdateRecommendationDto.toResponse({
            id: updated.id,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            deletedAt: updated.deletedAt,
          }) as unknown as IRecommendation,
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

  async DeleteNormalizationMatrix(
    normalizationMatrixId: string,
    req?: DeleteNormalizedMatrix,
  ): Promise<Record<string, INormalizedMatrices | INormalizedMatrices[]>> {
    try {
      if (
        req?.normalizedMatrixIds &&
        Array.isArray(req.normalizedMatrixIds) &&
        req.normalizedMatrixIds.length > 0
      ) {
        const foundNormalizedMatrices =
          await this.normalizedMatrixRepository.find({
            where: {
              lecturerId: In(req.normalizedMatrixIds),
            },
          });

        if (foundNormalizedMatrices.length < 1) {
          throw new NotFoundException('Recommendation not found');
        }

        const newdMatrixIds = foundNormalizedMatrices.map((n) => n.id);
        await this.rankingNormalizedMatricesRepository.delete({
          normalizedMatricesId: In(newdMatrixIds),
        });
        await this.normalizedMatrixRepository.delete(newdMatrixIds);

        return {
          data: foundNormalizedMatrices.map((data, index) =>
            UpdateRecommendationDto.toResponse({
              id: req.normalizedMatrixIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as INormalizedMatrices[],
        };
      } else if (req.deleteAll == true) {
        const allMatrices = await this.normalizedMatrixRepository.find();

        if (allMatrices.length < 1) {
          throw new NotFoundException('No normalization matrices found');
        }

        const normalizedMatrixIds = allMatrices.map((n) => n.id);
        await this.rankingNormalizedMatricesRepository.delete({
          normalizedMatricesId: In(normalizedMatrixIds),
        });
        await this.normalizedMatrixRepository.delete(normalizedMatrixIds);

        return {
          data: allMatrices.map((data) =>
            UpdateRecommendationDto.toResponse({
              id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as INormalizedMatrices[],
        };
      } else {
        const foundNormalizedMatrix =
          await this.normalizedMatrixRepository.findOne({
            where: {
              id: normalizationMatrixId as Uuid,
            },
          });

        if (!foundNormalizedMatrix) {
          throw new NotFoundException('Recommendation not found');
        }

        await this.normalizedMatrixRepository.delete(normalizationMatrixId);

        return {
          data: UpdateRecommendationDto.toResponse({
            id: foundNormalizedMatrix.id,
            createdAt: foundNormalizedMatrix.createdAt,
            updatedAt: foundNormalizedMatrix.updatedAt,
            deletedAt: foundNormalizedMatrix.deletedAt,
          }) as INormalizedMatrices,
        };
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new InternalServerErrorException(err.message);
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }
  async DeleteRankingMatrix(
    rankingMatrixId?: string,
    req?: DeleteRankingMatrix,
  ): Promise<Record<string, IRankingMatrices | IRankingMatrices[]>> {
    try {
      if (
        req?.rankingMatrixIds &&
        Array.isArray(req.rankingMatrixIds) &&
        req.rankingMatrixIds.length > 0
      ) {
        const foundRankingMatrices = await this.rankingMatricesRepository.find({
          where: {
            id: In(req.rankingMatrixIds),
          },
        });

        if (foundRankingMatrices.length < 1) {
          throw new NotFoundException('Recommendation not found');
        }

        await this.rankingNormalizedMatricesRepository.delete({
          rankingMatricesId: In(req.rankingMatrixIds),
        });
        await this.rankingMatricesRepository.delete(req.rankingMatrixIds);

        return {
          data: foundRankingMatrices.map((data, index) =>
            UpdateRecommendationDto.toResponse({
              id: req.rankingMatrixIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as IRankingMatrices[],
        };
      } else if (req.deleteAll == true) {
        const allMatrices = await this.rankingMatricesRepository.find();

        if (allMatrices.length < 1) {
          throw new NotFoundException('No ranking matrices found');
        }

        const rankingMatrixIds = allMatrices.map((n) => n.id);
        await this.rankingNormalizedMatricesRepository.delete({
          rankingMatricesId: In(rankingMatrixIds),
        });
        await this.rankingMatricesRepository.delete(
          allMatrices.map((n) => n.id),
        );

        return {
          data: allMatrices.map((data) =>
            UpdateRecommendationDto.toResponse({
              id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as IRankingMatrices[],
        };
      } else {
        const foundRankingMatrix = await this.rankingMatricesRepository.findOne(
          {
            where: {
              id: rankingMatrixId as Uuid,
            },
          },
        );

        if (!foundRankingMatrix) {
          throw new NotFoundException('Recommendation not found');
        }

        await this.rankingMatricesRepository.delete(rankingMatrixId);

        return {
          data: UpdateRecommendationDto.toResponse({
            id: foundRankingMatrix.id,
            createdAt: foundRankingMatrix.createdAt,
            updatedAt: foundRankingMatrix.updatedAt,
            deletedAt: foundRankingMatrix.deletedAt,
          }) as IRankingMatrices,
        };
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new InternalServerErrorException(err.message);
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }

  async DeleteRecommendation(
    recommendationId?: string,
    req?: DeleteRecommendationDto,
  ): Promise<Record<string, IRecommendation | IRecommendation[]>> {
    try {
      if (
        Array.isArray(req?.recommendationIds) &&
        req.recommendationIds.length > 0
      ) {
        const foundRecommendations = await this.recommendationRepository.find({
          where: {
            studentId: In(req.recommendationIds),
          },
        });

        if (foundRecommendations.length < 1) {
          throw new NotFoundException('Recommendation not found');
        }

        const recommendationIds = foundRecommendations.map((r) => r.id);

        await this.recommendationRepository.delete(recommendationIds);

        return {
          data: foundRecommendations.map((data, index) =>
            UpdateRecommendationDto.toResponse({
              id: req.recommendationIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as IRecommendation[],
        };
      } else if (req?.deleteAll == true) {
        const allRecommendations = await this.recommendationRepository.find();

        if (allRecommendations.length < 1) {
          throw new NotFoundException('No recommendations found');
        }

        await this.recommendationRepository.clear();

        return {
          data: allRecommendations.map((data) =>
            UpdateRecommendationDto.toResponse({
              id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as IRecommendation[],
        };
      } else {
        const foundRecommendation = await this.recommendationRepository.findOne(
          {
            where: {
              id: recommendationId as Uuid,
            },
          },
        );

        if (!foundRecommendation) {
          throw new NotFoundException('Recommendation not found');
        }

        await this.recommendationRepository.delete(recommendationId);

        return {
          data: UpdateRecommendationDto.toResponse({
            id: foundRecommendation.id,
            createdAt: foundRecommendation.createdAt,
            updatedAt: foundRecommendation.updatedAt,
            deletedAt: foundRecommendation.deletedAt,
          }) as IRecommendation,
        };
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new InternalServerErrorException(err.message);
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }

  async ExportRecommendationToPDF(): Promise<
    Record<string, { supabaseUrl: string }>
  > {
    const recommendations: IRecommendation[] =
      await this.recommendationRepository.find({
        relations: ['lecturer', 'student'],
      });

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: 'Laporan Rekomendasi Dosen Pembimbing',
        Author: 'Sistem Rekomendasi Dosen',
        Subject: 'Laporan Rekomendasi',
        Keywords: 'rekomendasi, dosen, pembimbing',
      },
    });

    this.generatePDFContent(doc, recommendations);
    doc.end();

    const chunks: Buffer[] = [];
    const fileBuffer = new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const buffer = await fileBuffer;

    const fileName = 'hasil-rekomendasi.pdf';

    const foundTemplate = await this.storageUrlRepository.findOne({
      where: { fileUrl: Like(`%${fileName}%`) },
    });

    let supabaseUrl: string;

    if (foundTemplate) {
      const relativePath = getRelativeFilePath(foundTemplate.fileUrl);

      await this.supabaseService.deleteFile(relativePath);
      await this.storageUrlRepository.delete(foundTemplate.id);
    }
    supabaseUrl = await this.supabaseService.uploadFile(
      buffer as Buffer<ArrayBufferLike>,
      fileName,
    );

    await this.storageUrlRepository.save({
      fileUrl: supabaseUrl,
      fileType: StorageFileType.PDF,
    });

    return { data: { supabaseUrl } };
  }

  private generatePDFContent(
    doc: typeof PDFDocument,
    recommendations: IRecommendation[],
  ) {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    this.addHeader(doc, currentDate);
    this.addSummarySection(doc, recommendations);
    this.addDataTable(doc, recommendations);
    this.addFooter(doc);
  }

  // private async getImageBufferFromURL(url: string): Promise<Buffer> {
  //   const response = await axios.get(url, {
  //     responseType: 'arraybuffer',
  //   });
  //   return Buffer.from(response.data, 'binary');
  // }

  private addHeader(doc: typeof PDFDocument, currentDate: string) {
    // const imagePath = path.join(process.cwd(), 'assets', 'unisba.png');

    const pageWidth = doc.page.width;
    const margin = 30;
    const headerHeight = 140;
    const padding = 20;

    doc
      .rect(margin, 30, pageWidth - margin * 2, headerHeight)
      .fillAndStroke('#667eea', '#667eea');

    // const logoSize = 60;
    // const logoX = margin + padding;
    // const logoY = 45;

    // try {
    //   if (fs.existsSync(imagePath)) {
    //     const imageBuffer = fs.readFileSync(imagePath);
    //     console.log('Image loaded successfully');
    //     doc.image(imageBuffer, logoX, logoY, {
    //       width: logoSize,
    //       height: logoSize,
    //     });
    //   } else {
    //     console.warn(Image not found at: ${imagePath});
    //     doc
    //       .rect(logoX, logoY, logoSize, logoSize)
    //       .fillAndStroke('#ffffff', '#ffffff');

    //     doc
    //       .fillColor('#667eea')
    //       .fontSize(8)
    //       .font('Helvetica-Bold')
    //       .text('LOGO', logoX + 20, logoY + 25);
    //   }
    // } catch (error) {
    //   console.error('Error loading image:', error);
    //   doc
    //     .rect(logoX, logoY, logoSize, logoSize)
    //     .fillAndStroke('#ffffff', '#ffffff');

    //   doc
    //     .fillColor('#667eea')
    //     .fontSize(8)
    //     .font('Helvetica-Bold')
    //     .text('LOGO', logoX + 20, logoY + 25);
    // }

    const contentStartX = 20 + padding;
    const contentWidth = pageWidth - contentStartX - padding - margin;

    doc
      .fillColor('white')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('LAPORAN HASIL PEMILIHAN DOSEN PEMBIMBING', contentStartX, 50, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Rekomendasi Dosen Pembimbing Tugas Akhir', contentStartX, 175, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .fillColor('#e8eaed')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('UNIVERSITAS ISLAM BALITAR', contentStartX, 75, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Fakultas Sains dan Teknologi', contentStartX, 100, {
        width: contentWidth,
        align: 'center',
      });
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Prodi Teknik Informatika', contentStartX, 115, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .fillColor('#e8eaed')
      .fontSize(9)
      .font('Helvetica')
      .text(`Dicetak pada: ${currentDate}`, contentStartX, 155, {
        width: contentWidth,
        align: 'right',
      });

    doc.y = 190;
  }

  private async addSummarySection(
    doc: typeof PDFDocument,
    recommendations: IRecommendation[],
  ) {
    const pageWidth = doc.page.width;
    const margin = 30;
    const padding = 15;
    const sectionHeight = 70;
    const startY = doc.y + 10;

    doc
      .rect(margin, startY, pageWidth - margin * 2, sectionHeight)
      .fill('#f8f9fa')
      .stroke('#dee2e6');

    const totalStudents = recommendations.length;
    const uniqueLecturer1 = await this.lecturerRepository.find({
      where: { tipePembimbing: TipePembimbingEnum.PEMBIMBING_SATU },
    });
    const uniqueLecturer2 = await this.lecturerRepository.find({
      where: { tipePembimbing: TipePembimbingEnum.PEMBIMBING_DUA },
    });

    doc
      .fillColor('#2c3e50')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('RINGKASAN DATA', margin + padding, startY + padding);

    const dataY = startY + padding + 25;
    const leftColX = margin + padding;
    const rightColX = pageWidth / 2 + padding;

    doc.fontSize(10).font('Helvetica').fillColor('#444444');

    doc.text(`Total Mahasiswa: ${totalStudents}`, leftColX, dataY);
    doc.text(
      `Dosen Pembimbing 1: ${uniqueLecturer1.length} orang`,
      leftColX,
      dataY + 15,
    );

    doc.text(
      `Dosen Pembimbing 2: ${uniqueLecturer2.length} orang`,
      rightColX,
      dataY,
    );
    doc.text(`Status: Aktif`, rightColX, dataY + 15);

    doc.y = startY + sectionHeight + 20;
  }

  private addDataTable(
    doc: typeof PDFDocument,
    recommendations: IRecommendation[],
  ) {
    const pageWidth = doc.page.width;
    const margin = 30;
    const tableWidth = pageWidth - margin * 2;
    const rowHeight = 40;
    const headerHeight = 35;
    const tableTop = doc.y + 10;

    const columns = {
      no: { x: margin, width: tableWidth * 0.05 },
      student: { x: margin + tableWidth * 0.05, width: tableWidth * 0.25 },
      thesis: { x: margin + tableWidth * 0.3, width: tableWidth * 0.4 },
      lecturer1: { x: margin + tableWidth * 0.7, width: tableWidth * 0.15 },
      lecturer2: { x: margin + tableWidth * 0.85, width: tableWidth * 0.15 },
    };

    this.addTableHeader(
      doc,
      tableTop,
      headerHeight,
      tableWidth,
      columns,
      margin,
    );

    let currentY = tableTop + headerHeight;
    doc.font('Helvetica').fontSize(8);

    const formattedData = this.formatRecommendationData(recommendations);

    formattedData.forEach((rec, index) => {
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        currentY = 50;
        this.addTableHeader(
          doc,
          currentY,
          headerHeight,
          tableWidth,
          columns,
          margin,
        );
        currentY += headerHeight;
        doc.font('Helvetica').fontSize(8);
      }

      if (index % 2 === 0) {
        doc.rect(margin, currentY, tableWidth, rowHeight).fill('#f8f9fa');
      }

      doc.rect(margin, currentY, tableWidth, rowHeight).stroke('#dee2e6');
      doc.fillColor('#2c3e50');

      const cellPadding = 5;
      const textY = currentY + 8;

      doc.text(
        (index + 1).toString(),
        columns.no.x + cellPadding,
        currentY + (rowHeight - 12) / 2,
        {
          width: columns.no.width - cellPadding * 2,
          align: 'center',
        },
      );

      doc.text(rec.studentName || '-', columns.student.x + cellPadding, textY, {
        width: columns.student.width - cellPadding * 2,
        height: rowHeight - 16,
        lineGap: 2,
      });

      const thesisTitle = rec.judulSkripsi || '-';
      doc.text(thesisTitle, columns.thesis.x + cellPadding, textY, {
        width: columns.thesis.width - cellPadding * 2,
        height: rowHeight - 16,
        lineGap: 2,
      });

      doc.text(
        rec.lecturerFirst || '-',
        columns.lecturer1.x + cellPadding,
        textY,
        {
          width: columns.lecturer1.width - cellPadding * 2,
          height: rowHeight - 16,
          lineGap: 2,
        },
      );

      doc.text(
        rec.lecturerSecond || '-',
        columns.lecturer2.x + cellPadding,
        textY,
        {
          width: columns.lecturer2.width - cellPadding * 2,
          height: rowHeight - 16,
          lineGap: 2,
        },
      );

      currentY += rowHeight;
    });

    doc.y = currentY + 20;
  }

  private addTableHeader(
    doc: typeof PDFDocument,
    tableTop: number,
    headerHeight: number,
    tableWidth: number,
    columns: any,
    margin: number,
  ) {
    doc
      .rect(margin, tableTop, tableWidth, headerHeight)
      .fillAndStroke('#667eea', '#667eea');

    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

    const headerPadding = 5;
    const headerTextY = tableTop + (headerHeight - 12) / 2;

    doc.text('No', columns.no.x + headerPadding, headerTextY, {
      width: columns.no.width - headerPadding * 2,
      align: 'center',
    });

    doc.text('Nama Mahasiswa', columns.student.x + headerPadding, headerTextY, {
      width: columns.student.width - headerPadding * 2,
      align: 'left',
    });

    doc.text('Judul Skripsi', columns.thesis.x + headerPadding, headerTextY, {
      width: columns.thesis.width - headerPadding * 2,
      align: 'left',
    });

    doc.text('Pembimbing 1', columns.lecturer1.x + headerPadding, headerTextY, {
      width: columns.lecturer1.width - headerPadding * 2,
      align: 'center',
    });

    doc.text('Pembimbing 2', columns.lecturer2.x + headerPadding, headerTextY, {
      width: columns.lecturer2.width - headerPadding * 2,
      align: 'center',
    });

    doc.strokeColor('#5a67d8').lineWidth(1);
    Object.values(columns).forEach((col: any, index) => {
      if (index > 0) {
        doc
          .moveTo(col.x, tableTop)
          .lineTo(col.x, tableTop + headerHeight)
          .stroke();
      }
    });
  }

  private formatRecommendationData(recommendations: IRecommendation[]) {
    const recommendationMap = new Map<string, any>();

    recommendations.forEach((recommendation) => {
      const studentId = recommendation.studentId;
      if (!studentId) return;

      if (!recommendationMap.has(studentId)) {
        recommendationMap.set(studentId, {
          id: recommendation.id,
          studentId: studentId,
          studentName: recommendation.student?.fullName ?? '-',
          judulSkripsi: recommendation.student?.judulSkripsi ?? '-',
          lecturerFirst: null,
          valueFirst: null,
          lecturerSecond: null,
          valueSecond: null,
        });
      }

      const studentData = recommendationMap.get(studentId);
      if (!studentData) return;

      if (recommendation.position === TipePembimbingEnum.PEMBIMBING_SATU) {
        studentData.lecturerFirst = recommendation.lecturer?.fullName ?? '-';
        studentData.valueFirst = recommendation.recommendationScore ?? null;
      }

      if (recommendation.position === TipePembimbingEnum.PEMBIMBING_DUA) {
        studentData.lecturerSecond = recommendation.lecturer?.fullName ?? '-';
        studentData.valueSecond = recommendation.recommendationScore ?? null;
      }
    });

    return Array.from(recommendationMap.values());
  }

  private addFooter(doc: typeof PDFDocument) {
    const pageWidth = doc.page.width;
    const margin = 30;
    const footerHeight = 90;
    const padding = 15;
    const footerY = doc.y + 20;

    doc
      .rect(margin, footerY, pageWidth - margin * 2, footerHeight)
      .fill('#f8f9fa')
      .stroke('#dee2e6');

    doc
      .fillColor('#2c3e50')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('KETERANGAN:', margin + padding, footerY + padding);

    doc.fontSize(9).font('Helvetica').fillColor('#5a6c7d');

    const notes = [
      '• Laporan ini dibuat secara otomatis oleh Sistem Rekomendasi Dosen Pembimbing',
      '• Data dosen pembimbing telah disesuaikan berdasarkan bidang keahlian dan beban kerja',
      '• Untuk informasi lebih lanjut, hubungi Koordinator Program Studi',
    ];

    notes.forEach((note, index) => {
      doc.text(note, margin + padding, footerY + padding + 25 + index * 12, {
        width: pageWidth - margin * 2 - padding * 2,
      });
    });

    this.addPageNumbers(doc);
  }

  private addPageNumbers(doc: typeof PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;
    const pageWidth = doc.page.width;
    const margin = 30;

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) {
        doc.switchToPage(i);
      }

      doc
        .fontSize(8)
        .fillColor('#95a5a6')
        .font('Helvetica')
        .text(
          `Halaman ${i + 1} dari ${pageCount}`,
          margin,
          doc.page.height - 25,
          {
            width: pageWidth - margin * 2,
            align: 'center',
          },
        );
    }

    if (pageCount > 1) {
      doc.switchToPage(pageCount - 1);
    }
  }
}
