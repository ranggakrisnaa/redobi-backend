import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ReccomendationStageEnum } from '@/common/enums/reccomendation-stage.enum';
import { Uuid } from '@/common/types/common.type';
import { CriteriaTypeEnum } from '@/database/enums/criteria-type.enum';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { TipePembimbingEnum } from '@/database/enums/tipe-pembimbing.enum';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '@/database/interface-model/ranking-matrices-entity.interface';
import { IReccomendation } from '@/database/interface-model/reccomendation-entity.interface';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { LecturerRepository } from '../lecturer/lecturer.repository';
import { DeleteNormalizedMatrix } from '../normalized-matrix/dto/delete.dto';
import { NormalizedMatrixRepository } from '../normalized-matrix/normalized-matrix.repository';
import { DeleteRankingMatrix } from '../ranking-matrices/dto/delete.dto';
import { RankingMatricesRepository } from '../ranking-matrices/ranking-matrices.repository';
import { RankingNormalizedMatricesRepository } from '../ranking-normalized-matrices/ranking-normalized-matrices.repository';
import { StudentRepository } from '../student/student.repository';
import { ThesisKeywordRepository } from '../thesis-keyword/thesis-keyword.repository';
import { DeleteReccomendationDto } from './dto/delete.dto';
import { ReccomendationPaginationReqQuery } from './dto/query.dto';
import { UpdateReccomendationDto } from './dto/update.dto';
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
    private dataSource: DataSource,
  ) {}

  async Pagination(
    reqQuery: ReccomendationPaginationReqQuery,
  ): Promise<
    OffsetPaginatedDto<INormalizedMatrices | IRankingMatrices | IReccomendation>
  > {
    try {
      let responseData: OffsetPaginatedDto<
        INormalizedMatrices | IRankingMatrices | IReccomendation
      >;
      switch (reqQuery.stage) {
        case ReccomendationStageEnum.NORMALIZATION:
          responseData =
            await this.normalizedMatrixRepository.Pagination(reqQuery);
          break;
        case ReccomendationStageEnum.RANKING_NORMALIZATION:
          responseData =
            await this.rankingMatricesRepository.Pagination(reqQuery);
          break;
        case ReccomendationStageEnum.RECCOMENDATION:
          responseData =
            await this.reccomendationRepository.Pagination(reqQuery);
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

  async Detail() {}

  async CreateNormalizationMatrix(): Promise<Record<string, string>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      const existingNormalizedMatrices =
        await this.normalizedMatrixRepository.find();
      const normalizedMatrixMap = new Map(
        existingNormalizedMatrices.map((matrix) => [
          `${matrix.lecturerId}-${matrix.criteriaId}`,
          matrix,
        ]),
      );

      const subCriteriaScoresMap = new Map<
        number,
        { scores: number[]; type: CriteriaTypeEnum }
      >();
      const bulkUpdateData = [];
      const bulkInsertData = [];

      const lecturersToUpdate = [];

      for (const assessment of allAssessments) {
        if (!assessment.lecturer.tipePembimbing) {
          const hasValidLinear = assessment.assessmentSubCriteria.some(
            (sub) => sub.subCriteria.name === 'Linear' && sub.score > 0,
          );
          const hasValidAsistenAhli = assessment.assessmentSubCriteria.some(
            (sub) => sub.subCriteria.name === 'Asisten Ahli' && sub.score > 0,
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

      const subCriteriaScoreMap = new Map<number, number>();
      for (const [subId, data] of subCriteriaScoresMap.entries()) {
        const { scores, type } = data;
        const value =
          type === CriteriaTypeEnum.BENEFIT
            ? Math.max(...scores)
            : Math.min(...scores);

        subCriteriaScoreMap.set(subId, value);
      }

      const groupedNormalizedValues = new Map<string, number>();
      const entryToGroupKey = new Map<
        string,
        { lecturerId: string; criteriaId: number }
      >();

      for (const assessment of allAssessments) {
        for (const sub of assessment.assessmentSubCriteria) {
          const criteria = sub.subCriteria.criteria;
          const refValue = subCriteriaScoreMap.get(sub.subCriteriaId) || 1;
          const key = `${assessment.lecturerId}-${criteria.id}`;

          let normalizedScore = 0;
          if (criteria.type === CriteriaTypeEnum.BENEFIT) {
            normalizedScore = refValue > 0 ? sub.score / refValue : 0;
            console.log(normalizedScore);
          } else {
            normalizedScore = sub.score > 0 ? refValue / sub.score : 0;
          }

          groupedNormalizedValues.set(
            key,
            (groupedNormalizedValues.get(key) || 0) + normalizedScore,
          );

          entryToGroupKey.set(key, {
            lecturerId: assessment.lecturerId,
            criteriaId: criteria.id,
          });
        }
      }

      for (const [key, totalValue] of groupedNormalizedValues.entries()) {
        const { lecturerId, criteriaId } = entryToGroupKey.get(key);
        const existingRecord = normalizedMatrixMap.get(key);

        if (existingRecord) {
          bulkUpdateData.push({
            id: existingRecord.id,
            normalizedValue: totalValue,
          });
        } else {
          bulkInsertData.push({
            lecturerId,
            criteriaId,
            normalizedValue: totalValue,
          });
        }
      }

      if (bulkUpdateData.length > 0) {
        await queryRunner.manager.save(
          this.normalizedMatrixRepository.metadata.target,
          bulkUpdateData,
        );
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

      return {
        message: 'Matrix normalization ranknig created successfully.',
      };
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async CreateReccomendation(): Promise<Record<string, string>> {
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

      return {
        message: 'Reccomendation created successfully.',
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

  async UpdateReccomendation(
    reccomendationId: string,
    req: UpdateReccomendationDto,
  ): Promise<Record<string, IReccomendation | IReccomendation[]>> {
    try {
      if (!reccomendationId) {
        const foundReccomendations = await this.reccomendationRepository.find({
          where: {
            id: In(req.reccomendationIds),
          },
        });

        if (!foundReccomendations.length) {
          throw new NotFoundException('Reccomendation not found');
        }

        const mappedReccomendations = foundReccomendations.map(
          (reccomendation, index) => ({
            ...reccomendation,
            lecturerId: req.lecturerIds[index],
            studentId: req.studentIds[index],
          }),
        );

        const updated = await this.reccomendationRepository.save(
          mappedReccomendations,
        );

        return {
          data: updated.map((data, index) =>
            UpdateReccomendationDto.toResponse({
              id: req.reccomendationIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as unknown as IReccomendation[],
        };
      } else {
        const foundReccomendation = await this.reccomendationRepository.findOne(
          { where: { id: reccomendationId as Uuid } },
        );
        if (!foundReccomendation) {
          throw new NotFoundException('Reccomendation not found');
        }

        foundReccomendation.lecturerId = req.lecturerIds[0] as Uuid;
        foundReccomendation.studentId = req.studentIds[0] as Uuid;

        const updated =
          await this.reccomendationRepository.save(foundReccomendation);

        return {
          data: UpdateReccomendationDto.toResponse({
            id: updated.id,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            deletedAt: updated.deletedAt,
          }) as unknown as IReccomendation,
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
    req: DeleteNormalizedMatrix,
  ): Promise<Record<string, INormalizedMatrices | INormalizedMatrices[]>> {
    try {
      if (
        Array.isArray(req.normalizedMatrixIds) &&
        req.normalizedMatrixIds.length > 0
      ) {
        const foundNormalizedMatrices =
          await this.normalizedMatrixRepository.find({
            where: {
              id: In(req.normalizedMatrixIds),
            },
          });
        if (!foundNormalizedMatrices.length) {
          throw new NotFoundException('Reccomendation not found');
        }

        await this.normalizedMatrixRepository.delete(req.normalizedMatrixIds);

        return {
          data: foundNormalizedMatrices.map((data, index) =>
            UpdateReccomendationDto.toResponse({
              id: req.normalizedMatrixIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as unknown as INormalizedMatrices[],
        };
      } else {
        const foundNormalizedMatrix =
          await this.normalizedMatrixRepository.findOne({
            where: {
              id: normalizationMatrixId as Uuid,
            },
          });
        if (!foundNormalizedMatrix) {
          throw new NotFoundException('Reccomendation not found');
        }

        await this.normalizedMatrixRepository.delete(normalizationMatrixId);

        return {
          data: UpdateReccomendationDto.toResponse({
            id: foundNormalizedMatrix.id,
            createdAt: foundNormalizedMatrix.createdAt,
            updatedAt: foundNormalizedMatrix.updatedAt,
            deletedAt: foundNormalizedMatrix.deletedAt,
          }) as unknown as INormalizedMatrices,
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

  async DeleteRankingMatrix(
    rankingMatrixId: string,
    req: DeleteRankingMatrix,
  ): Promise<Record<string, IRankingMatrices | IRankingMatrices[]>> {
    try {
      if (
        Array.isArray(req.rankingMatrixIds) &&
        req.rankingMatrixIds.length > 0
      ) {
        const foundRankingMatrices = await this.rankingMatricesRepository.find({
          where: {
            id: In(req.rankingMatrixIds),
          },
        });
        if (!foundRankingMatrices.length) {
          throw new NotFoundException('Reccomendation not found');
        }

        await this.rankingMatricesRepository.delete(req.rankingMatrixIds);

        return {
          data: foundRankingMatrices.map((data, index) =>
            UpdateReccomendationDto.toResponse({
              id: req.rankingMatrixIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as unknown as IRankingMatrices[],
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
          throw new NotFoundException('Reccomendation not found');
        }

        await this.rankingMatricesRepository.delete(rankingMatrixId);

        return {
          data: UpdateReccomendationDto.toResponse({
            id: foundRankingMatrix.id,
            createdAt: foundRankingMatrix.createdAt,
            updatedAt: foundRankingMatrix.updatedAt,
            deletedAt: foundRankingMatrix.deletedAt,
          }) as unknown as IRankingMatrices,
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

  async DeleteReccomendation(
    reccomendationId: string,
    req: DeleteReccomendationDto,
  ): Promise<Record<string, IReccomendation | IReccomendation[]>> {
    try {
      if (
        Array.isArray(req.reccomendationIds) &&
        req.reccomendationIds.length > 0
      ) {
        const foundReccomendations = await this.reccomendationRepository.find({
          where: {
            id: In(req.reccomendationIds),
          },
        });
        if (!foundReccomendations.length) {
          throw new NotFoundException('Reccomendation not found');
        }

        await this.reccomendationRepository.delete(req.reccomendationIds);

        return {
          data: foundReccomendations.map((data, index) =>
            UpdateReccomendationDto.toResponse({
              id: req.reccomendationIds[index] as Uuid,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              deletedAt: data.deletedAt,
            }),
          ) as unknown as IReccomendation[],
        };
      } else {
        const foundReccomendation = await this.reccomendationRepository.findOne(
          {
            where: {
              id: reccomendationId as Uuid,
            },
          },
        );
        if (!foundReccomendation) {
          throw new NotFoundException('Reccomendation not found');
        }

        await this.reccomendationRepository.delete(reccomendationId);

        return {
          data: UpdateReccomendationDto.toResponse({
            id: foundReccomendation.id,
            createdAt: foundReccomendation.createdAt,
            updatedAt: foundReccomendation.updatedAt,
            deletedAt: foundReccomendation.deletedAt,
          }) as unknown as IReccomendation,
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
