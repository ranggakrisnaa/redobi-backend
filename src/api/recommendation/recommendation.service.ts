/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { getRelativeFilePath, roundToThreeDecimals } from '@/utils/util';
import {
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

      const lecturersToUpdate = [];
      for (const assessment of allAssessments) {
        if (!assessment.lecturer.tipePembimbing) {
          const hasValidLinear = assessment.assessmentSubCriteria.some(
            (sub) => sub.subCriteria.name === 'Linear' && sub.score === 100,
          );
          const hasValidAsistenAhli = assessment.assessmentSubCriteria.some(
            (sub) =>
              sub.subCriteria.name === 'Asisten Ahli' && sub.score === 100,
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
      }

      if (lecturersToUpdate.length > 0) {
        await queryRunner.manager.save(
          this.lecturerRepository.metadata.target,
          lecturersToUpdate,
        );
      }

      const decisionMatrix = new Map<string, Map<number, number>>();
      const lecturerInfo = new Map<string, { id: string; name: string }>();
      const subCriteriaInfo = new Map<
        number,
        {
          name: string;
          weight: number;
          criteriaId: number;
          criteriaName: string;
          criteriaType: CriteriaTypeEnum;
        }
      >();

      // Build decision matrix and collect sub-criteria info
      for (const assessment of allAssessments) {
        const lecturerId = assessment.lecturerId;
        const lecturerName = assessment.lecturer.fullName;

        // Store lecturer info
        lecturerInfo.set(lecturerId, {
          id: lecturerId,
          name: lecturerName,
        });

        if (!decisionMatrix.has(lecturerId)) {
          decisionMatrix.set(lecturerId, new Map<number, number>());
        }

        for (const sub of assessment.assessmentSubCriteria) {
          const subId = sub.subCriteriaId;

          if (!subCriteriaInfo.has(subId)) {
            subCriteriaInfo.set(subId, {
              name: sub.subCriteria.name,
              weight: sub.subCriteria.weight || 0,
              criteriaId: sub.subCriteria.criteria.id,
              criteriaName: sub.subCriteria.criteria.name,
              criteriaType: sub.subCriteria.criteria.type,
            });
          }

          decisionMatrix.get(lecturerId).set(subId, sub.score);
        }
      }

      console.log('Decision Matrix:');
      for (const [lecturerId, scores] of decisionMatrix.entries()) {
        const lecturer = lecturerInfo.get(lecturerId);
        console.log(
          `${lecturer.name} (${lecturerId}):`,
          Object.fromEntries(scores),
        );
      }

      const subCriteriaRefValues = new Map<number, number>();

      for (const [subId, info] of subCriteriaInfo.entries()) {
        const allScoresForSubCriteria = [];

        for (const [lecturerId, scores] of decisionMatrix.entries()) {
          const score = scores.get(subId) || 0;
          allScoresForSubCriteria.push(score);
        }

        let refValue = 0;
        if (info.criteriaType === CriteriaTypeEnum.BENEFIT) {
          refValue = Math.max(...allScoresForSubCriteria);
        } else {
          const nonZeroScores = allScoresForSubCriteria.filter((s) => s > 0);
          refValue = nonZeroScores.length > 0 ? Math.min(...nonZeroScores) : 1;
        }

        subCriteriaRefValues.set(subId, refValue);
      }

      console.log('Reference Values per Sub-Criteria:');
      for (const [subId, refValue] of subCriteriaRefValues.entries()) {
        const info = subCriteriaInfo.get(subId);
        console.log(`${info.name} (${info.criteriaType}): ${refValue}`);
      }

      const normalizedMatrix = new Map<string, Map<number, number>>();

      for (const [lecturerId, scores] of decisionMatrix.entries()) {
        normalizedMatrix.set(lecturerId, new Map<number, number>());

        for (const [subId, score] of scores.entries()) {
          const info = subCriteriaInfo.get(subId);
          const refValue = subCriteriaRefValues.get(subId);
          let normalizedScore = 0;

          if (info.criteriaType === CriteriaTypeEnum.BENEFIT) {
            normalizedScore = refValue > 0 ? score / refValue : 0;
          } else {
            normalizedScore = score > 0 ? refValue / score : 0;
          }

          normalizedMatrix.get(lecturerId).set(subId, normalizedScore);
        }
      }

      const weightedMatrix = new Map<string, Map<number, number>>();

      for (const [lecturerId, normalizedScores] of normalizedMatrix.entries()) {
        weightedMatrix.set(lecturerId, new Map<number, number>());

        for (const [subId, normalizedScore] of normalizedScores.entries()) {
          const info = subCriteriaInfo.get(subId);
          const weightedScore = normalizedScore * info.weight;

          weightedMatrix.get(lecturerId).set(subId, weightedScore);
        }
      }

      console.log('\n=== DETAILED NORMALIZATION REPORT (Excel Format) ===');
      const detailedReport = [];

      for (const [lecturerId, scores] of decisionMatrix.entries()) {
        const lecturer = lecturerInfo.get(lecturerId);

        for (const [subId, originalScore] of scores.entries()) {
          const info = subCriteriaInfo.get(subId);
          const normalizedScore = normalizedMatrix.get(lecturerId).get(subId);
          const weightedScore = weightedMatrix.get(lecturerId).get(subId);

          detailedReport.push({
            lecturerName: lecturer.name,
            criteriaName: info.criteriaName,
            subCriteriaName: info.name,
            originalScore,
            normalizedScore,
            weight: info.weight,
            weightedScore,
          });
        }
      }

      console.table(detailedReport);

      const criteriaAggregated = new Map<string, Map<number, number>>();

      for (const [lecturerId, weightedScores] of weightedMatrix.entries()) {
        criteriaAggregated.set(lecturerId, new Map<number, number>());

        for (const [subId, weightedScore] of weightedScores.entries()) {
          const info = subCriteriaInfo.get(subId);
          const criteriaId = info.criteriaId;

          const currentTotal =
            criteriaAggregated.get(lecturerId).get(criteriaId) || 0;
          const newTotal = currentTotal + weightedScore;
          criteriaAggregated.get(lecturerId).set(criteriaId, newTotal);
        }
      }

      const bulkInsertData = [];
      for (const [lecturerId, criteriaScores] of criteriaAggregated.entries()) {
        for (const [criteriaId, aggregatedScore] of criteriaScores.entries()) {
          bulkInsertData.push({
            lecturerId: lecturerId,
            criteriaId: criteriaId,
            normalizedValue: aggregatedScore,
          });
        }
      }

      if (bulkInsertData.length > 0) {
        await queryRunner.manager.insert(
          this.normalizedMatrixRepository.metadata.target,
          bulkInsertData,
        );
      }

      const finalTotalScores: Record<string, number> = {};

      for (const [lecturerId, criteriaScores] of criteriaAggregated.entries()) {
        const lecturer = lecturerInfo.get(lecturerId);
        let totalScore = 0;

        for (const [criteriaId, score] of criteriaScores.entries()) {
          totalScore += score;
        }

        finalTotalScores[lecturer.name] = roundToThreeDecimals(totalScore);
      }

      console.log('\n=== FINAL RANKING SCORES ===');
      console.table(
        Object.entries(finalTotalScores)
          .sort(([, a], [, b]) => b - a) // Sort by score descending
          .map(([lecturerName, totalScore], index) => ({
            rank: index + 1,
            lecturerName,
            totalScore,
          })),
      );

      await queryRunner.commitTransaction();

      return {
        message:
          'SAW Matrix normalization completed successfully with correct Excel-like calculation.',
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

      console.log(`=== THESIS RANKING PROCESS STARTED ===`);
      console.log(`Total students to process: ${foundAllStudents.length}`);

      const studentMapWithThesisValue = new Map<
        string,
        { studentId: string; major: string; value: number }
      >();

      // Enhanced logging for thesis keyword matching
      for (const student of foundAllStudents) {
        console.log(`\n--- Processing Student: ${student.id} ---`);
        console.log(`Student Major: ${student.major}`);
        console.log(`Thesis Title: "${student.judulSkripsi}"`);

        const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
          where: {
            category: student.major as unknown as ThesisKeywordCategoryEnum,
          },
          relations: ['keyword'],
        });

        if (!foundThesisKeyword) {
          console.log(
            `⚠️  No thesis keywords found for major: ${student.major}`,
          );
          studentMapWithThesisValue.set(student.id, {
            studentId: student.id,
            major: student.major,
            value: 0,
          });
          continue;
        }

        console.log(
          `Available keywords for ${student.major}:`,
          foundThesisKeyword.keyword.map((k) => k.name).join(', '),
        );

        const keywordArray = student.judulSkripsi.toLowerCase().split(' ');
        console.log(`Thesis title words:`, keywordArray);

        const matchedKeywords = keywordArray.filter((word) =>
          foundThesisKeyword?.keyword.some(
            (k) => k.name.toLowerCase() === word,
          ),
        );

        console.log(
          `Matched keywords:`,
          matchedKeywords.length > 0 ? matchedKeywords : 'None',
        );

        const value = matchedKeywords.length * 10;
        console.log(
          `Calculated score: ${value} (${matchedKeywords.length} matches × 10)`,
        );

        studentMapWithThesisValue.set(student.id, {
          studentId: student.id,
          major: student.major,
          value,
        });
      }

      // Enhanced logging for ranking calculation
      console.log(`\n=== RANKING CALCULATION ===`);
      const ranking = Array.from(studentMapWithThesisValue.entries())
        .sort((a, b) => b[1].value - a[1].value)
        .map(([studentId, value], index) => ({
          studentId,
          major: value.major,
          value: value.value,
          rank: index + 1,
        }));

      console.log(`\n--- OVERALL RANKING RESULTS ---`);
      ranking.forEach((student, index) => {
        const studentInfo = foundAllStudents.find(
          (s) => s.id === student.studentId,
        );
        console.log(
          `Rank ${student.rank}: Student ${student.studentId} (${student.major}) - Score: ${student.value}`,
        );
        if (studentInfo) {
          console.log(`  Title: "${studentInfo.judulSkripsi}"`);
        }
      });

      const majors = [
        ThesisKeywordCategoryEnum.REKAYASA_PERANGKAT_LUNAK,
        ThesisKeywordCategoryEnum.SISTEM_CERDAS,
        ThesisKeywordCategoryEnum.MULTIMEDIA,
      ];

      // Log ranking by major
      console.log(`\n=== RANKING BY MAJOR ===`);
      majors.forEach((major) => {
        const majorRanking = ranking.filter((r) => r.major === major);
        console.log(`\n--- ${major} Ranking ---`);
        if (majorRanking.length === 0) {
          console.log(`No students found for major: ${major}`);
          return;
        }

        majorRanking.forEach((student, index) => {
          const studentInfo = foundAllStudents.find(
            (s) => s.id === student.studentId,
          );
          console.log(
            `  ${index + 1}. Student ${student.studentId} - Score: ${student.value}`,
          );
          if (studentInfo) {
            console.log(`     Title: "${studentInfo.judulSkripsi}"`);
          }
        });

        // Statistics for this major
        const scores = majorRanking.map((s) => s.value);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const zeroScoreCount = scores.filter((s) => s === 0).length;

        console.log(`  Statistics:`);
        console.log(`    - Total students: ${majorRanking.length}`);
        console.log(`    - Average score: ${avgScore.toFixed(2)}`);
        console.log(`    - Highest score: ${maxScore}`);
        console.log(`    - Lowest score: ${minScore}`);
        console.log(
          `    - Students with zero score: ${zeroScoreCount} (${((zeroScoreCount / majorRanking.length) * 100).toFixed(1)}%)`,
        );
      });

      await this.recommendationRepository.delete({});

      const globalLecturerAssignments = new Map<string, number>();

      for (const major of majors) {
        const filteredRanking = ranking.filter(
          (value) => value.major === major,
        );

        if (filteredRanking.length === 0) continue;

        const allLecturers = foundAllRankings.map((r) => r.lecturer);

        const pembimbing1Lecturers = allLecturers.filter(
          (l) => l.tipePembimbing === TipePembimbingEnum.PEMBIMBING_SATU,
        );
        const pembimbing2Lecturers = allLecturers.filter(
          (l) => l.tipePembimbing === TipePembimbingEnum.PEMBIMBING_DUA,
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

        [...pembimbing1Lecturers, ...pembimbing2Lecturers].forEach(
          (lecturer) => {
            if (!globalLecturerAssignments.has(lecturer.id)) {
              globalLecturerAssignments.set(lecturer.id, 0);
            }
          },
        );

        const hasAvailableQuota = (lecturer: any) => {
          const currentAssignments =
            globalLecturerAssignments.get(lecturer.id) || 0;
          const totalLoad = lecturer.jumlahBimbingan + currentAssignments;
          return totalLoad < lecturer.kuotaBimbingan;
        };

        const getAvailableLecturers = (lecturers: any[]) => {
          return lecturers.filter((lecturer) => hasAvailableQuota(lecturer));
        };

        const getLeastLoadedFromAvailable = (lecturers: any[]) => {
          const available = getAvailableLecturers(lecturers);
          if (available.length === 0) return null;

          return available.reduce((prev, curr) => {
            const prevLoad =
              prev.jumlahBimbingan +
              (globalLecturerAssignments.get(prev.id) || 0);
            const currLoad =
              curr.jumlahBimbingan +
              (globalLecturerAssignments.get(curr.id) || 0);

            if (prevLoad !== currLoad) {
              return prevLoad < currLoad ? prev : curr;
            }

            const prevScore = lecturerRankingMap.get(prev.id) || 0;
            const currScore = lecturerRankingMap.get(curr.id) || 0;
            return prevScore >= currScore ? prev : curr;
          });
        };

        let assignedPembimbing1 = 0;
        let skippedPembimbing1 = 0;

        for (const student of filteredRanking) {
          if (pembimbing1Lecturers.length === 0) {
            skippedPembimbing1++;
            continue;
          }

          const selectedLecturer =
            getLeastLoadedFromAvailable(pembimbing1Lecturers);

          if (selectedLecturer) {
            await this.recommendationRepository.save({
              studentId: student.studentId,
              lecturerId: selectedLecturer.id,
              recommendationScore:
                lecturerRankingMap.get(selectedLecturer.id) || 0,
              position: TipePembimbingEnum.PEMBIMBING_SATU,
            });

            globalLecturerAssignments.set(
              selectedLecturer.id,
              (globalLecturerAssignments.get(selectedLecturer.id) || 0) + 1,
            );
            assignedPembimbing1++;
          } else {
            skippedPembimbing1++;
            console.log(
              `Major ${major}: Student ${student.studentId} cannot be assigned pembimbing 1 - all lecturers at full capacity`,
            );
          }
        }

        // Assign pembimbing 2 with strict quota enforcement
        let assignedPembimbing2 = 0;
        let skippedPembimbing2 = 0;

        for (const student of filteredRanking) {
          if (pembimbing2Lecturers.length === 0) {
            skippedPembimbing2++;
            continue;
          }

          const selectedLecturer =
            getLeastLoadedFromAvailable(pembimbing2Lecturers);

          if (selectedLecturer) {
            await this.recommendationRepository.save({
              studentId: student.studentId,
              lecturerId: selectedLecturer.id,
              recommendationScore:
                lecturerRankingMap.get(selectedLecturer.id) || 0,
              position: TipePembimbingEnum.PEMBIMBING_DUA,
            });

            globalLecturerAssignments.set(
              selectedLecturer.id,
              (globalLecturerAssignments.get(selectedLecturer.id) || 0) + 1,
            );
            assignedPembimbing2++;
          } else {
            skippedPembimbing2++;
            console.log(
              `Major ${major}: Student ${student.studentId} cannot be assigned pembimbing 2 - all lecturers at full capacity`,
            );
          }
        }

        console.log(`Major ${major} Summary:`);
        console.log(`- Students: ${filteredRanking.length}`);
        console.log(
          `- Pembimbing 1 assigned: ${assignedPembimbing1}, skipped: ${skippedPembimbing1}`,
        );
        console.log(
          `- Pembimbing 2 assigned: ${assignedPembimbing2}, skipped: ${skippedPembimbing2}`,
        );
      }

      const lecturerIds = foundAllRankings.map((r) => r.lecturer.id);
      for (const lecturerId of lecturerIds) {
        const actualStudentCount = await this.recommendationRepository.count({
          where: { lecturerId },
        });

        const lecturer = foundAllRankings.find(
          (r) => r.lecturer.id === lecturerId,
        )?.lecturer;
        if (lecturer && actualStudentCount > lecturer.kuotaBimbingan) {
          console.error(
            `QUOTA VIOLATION: Lecturer ${lecturer.id} has ${actualStudentCount} assignments but quota is ${lecturer.kuotaBimbingan}`,
          );

          const recommendations = await this.recommendationRepository.find({
            where: { lecturerId },
            order: { id: 'DESC' },
          });

          const excessCount = actualStudentCount - lecturer.kuotaBimbingan;
          for (let i = 0; i < excessCount; i++) {
            if (recommendations[i]) {
              await this.recommendationRepository.remove(recommendations[i]);
              console.log(
                `Removed excess assignment for lecturer ${lecturerId}`,
              );
            }
          }

          const finalCount = await this.recommendationRepository.count({
            where: { lecturerId },
          });

          await this.lecturerRepository.update(lecturerId, {
            jumlahBimbingan: finalCount,
          });
        } else {
          await this.lecturerRepository.update(lecturerId, {
            jumlahBimbingan: actualStudentCount,
          });
        }

        console.log(
          `Lecturer ${lecturerId}: ${actualStudentCount} assignments (quota: ${lecturer?.kuotaBimbingan || 'unknown'})`,
        );
      }

      console.log(`\n=== THESIS RANKING PROCESS COMPLETED ===`);

      return {
        message:
          'Recommendation created successfully for all majors with strict quota enforcement.',
      };
    } catch (err: unknown) {
      console.error('Error in CreateRecommendation:', err);
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
        const { recommendationIds = [], studentIds, lecturers } = req;

        // const invalidLecturers = lecturers.filter(
        //   (l) => !l.lecturerId || !l.positions,
        // );
        // if (invalidLecturers.length > 0) {
        //   throw new BadRequestException(
        //     'Each lecturer must have lecturerId and positions fields',
        //   );
        // }

        const validRecommendationIds = recommendationIds.filter(Boolean);

        const foundRecommendations = await this.recommendationRepository.find({
          where: { id: In(validRecommendationIds) },
        });

        const lecturerMap = new Map<string, string>();
        const studentMap = new Map<string, string>();
        const positionMap = new Map<string, string>();

        lecturers.forEach((lect, index) => {
          const recId = recommendationIds[index] ?? null;

          if (recId) {
            lecturerMap.set(recId, lect.lecturerId);
            studentMap.set(recId, studentIds[index]);
            positionMap.set(recId, lect.positions);
          }
        });

        const uniqueLecturerIds = [
          ...new Set(lecturers.map((l) => l.lecturerId)),
        ];

        const rankingMatrices = await this.rankingMatricesRepository.find({
          where: { lecturerId: In(uniqueLecturerIds) },
        });

        const rankingMap = new Map<string, number>();
        rankingMatrices.forEach((matrix) => {
          rankingMap.set(matrix.lecturerId, matrix.finalScore ?? 0);
        });

        const mappedRecommendations = lecturers.map((lect, index) => {
          const recId = recommendationIds[index] ?? null;
          const studentId = studentIds[index];
          const score = rankingMap.get(lect.lecturerId) ?? 0;

          const existing = recId
            ? foundRecommendations.find((r) => r.id === recId)
            : null;

          if (existing) {
            return {
              ...existing,
              lecturerId: lect.lecturerId,
              studentId,
              position: positionMap[index],
              recommendationScore: score,
              updatedAt: new Date(),
            };
          }

          return {
            lecturerId: lect.lecturerId,
            studentId,
            position: lect.positions,
            recommendationScore: score,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        const updated = await this.recommendationRepository.manager.transaction(
          async (tx) => {
            const savedRecommendations = await tx.save(
              this.recommendationRepository.target,
              mappedRecommendations,
            );

            await Promise.all(
              uniqueLecturerIds.map(async (lecturerId) => {
                const totalCount = await tx.count(
                  this.recommendationRepository.target,
                  {
                    where: { lecturerId: lecturerId as Uuid },
                  },
                );

                return tx.update(this.lecturerRepository.target, lecturerId, {
                  jumlahBimbingan: totalCount,
                });
              }),
            );

            return savedRecommendations;
          },
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
      }
    } catch (err: unknown) {
      console.error('Error updating recommendations:', err);

      if (err instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );
      }

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
          relations: ['lecturer'],
        });

        if (foundRecommendations.length < 1) {
          throw new NotFoundException('Recommendation not found');
        }

        const recommendationIds = foundRecommendations.map((r) => r.id);

        const lecturerIds = Array.from(
          new Set(
            foundRecommendations
              .filter((r) => r.lecturer?.id)
              .map((r) => r.lecturer!.id),
          ),
        );

        if (lecturerIds.length > 0) {
          await this.lecturerRepository.update(
            { id: In(lecturerIds) },
            { jumlahBimbingan: 0 },
          );
        }

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
      } else if (req?.deleteAll === true) {
        const allRecommendations = await this.recommendationRepository.find({
          relations: ['lecturer'],
        });

        if (allRecommendations.length < 1) {
          throw new NotFoundException('No recommendations found');
        }

        const lecturerIds = Array.from(
          new Set(
            allRecommendations
              .filter((r) => r.lecturer?.id)
              .map((r) => r.lecturer!.id),
          ),
        );

        if (lecturerIds.length > 0) {
          await this.lecturerRepository.update(
            { id: In(lecturerIds) },
            { jumlahBimbingan: 0 },
          );
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
            relations: ['lecturer'],
          },
        );

        if (!foundRecommendation) {
          throw new NotFoundException('Recommendation not found');
        }

        if (foundRecommendation.lecturer?.id) {
          await this.lecturerRepository.update(
            { id: foundRecommendation.lecturer.id },
            { jumlahBimbingan: 0 },
          );
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
