import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { IKeyword } from '@/database/interface-model/keyword-entity.interface';
import { IThesisKeyword } from '@/database/interface-model/thesis-keyword-entity.interface';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { keywordRepository } from '../keyword/keyword.repository';
import { CreateThesisKeywordDto } from './dto/create.dto';
import { DeleteThesisKeywordDto } from './dto/delete.dto';
import { ThesisKeywordReqQuery } from './dto/query.dto';
import { UpdateThesisKeywordDto } from './dto/update.dto';
import { ThesisKeywordRepository } from './thesis-keyword.repository';

@Injectable()
export class ThesisKeywordService {
  constructor(
    private readonly thesisKeywordRepository: ThesisKeywordRepository,
    private readonly keywordRepository: keywordRepository,
    private readonly dataSource: DataSource,
  ) {}

  async Pagination(
    reqQuery: ThesisKeywordReqQuery,
  ): Promise<OffsetPaginatedDto<IThesisKeyword>> {
    return this.thesisKeywordRepository.Pagination(reqQuery);
  }

  async Detail(
    thesisKeywordId: number,
  ): Promise<Record<string, IThesisKeyword>> {
    const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
      where: {
        id: thesisKeywordId,
      },
      relations: ['keyword'],
    });
    if (!foundThesisKeyword) {
      throw new BadRequestException('Thesis keyword is not found');
    }

    return { data: foundThesisKeyword };
  }

  async Create(
    req: CreateThesisKeywordDto,
  ): Promise<Record<string, IThesisKeyword>> {
    const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
      where: {
        category: req.category as ThesisKeywordCategoryEnum,
        keyword: {
          name: In(req.names),
        },
      },
      relations: ['keyword'],
    });

    if (foundThesisKeyword) {
      throw new BadRequestException('Thesis keyword already exists');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newThesisKeyword =
        await this.thesisKeywordRepository.createWithTransaction(queryRunner, {
          category: req.category,
        });

      const entities = req.names.map((name) => ({
        name,
        thesisKeywordId: newThesisKeyword.id,
      }));

      await this.keywordRepository.createWithTransaction(
        queryRunner,
        entities as unknown as IKeyword[],
      );

      await queryRunner.commitTransaction();

      return {
        data: CreateThesisKeywordDto.toResponse(
          newThesisKeyword,
        ) as unknown as IThesisKeyword,
      };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async Update(
    id: number,
    req: UpdateThesisKeywordDto,
  ): Promise<Record<string, IThesisKeyword>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const thesisKeyword = await this.thesisKeywordRepository.findOne({
        where: { id },
        relations: ['keyword'],
      });

      if (!thesisKeyword) {
        throw new NotFoundException('Thesis keyword not found');
      }

      if (req.category && req.category !== thesisKeyword.category) {
        thesisKeyword.category = req.category;
        await queryRunner.manager.save(thesisKeyword);
      }

      if (req.names && req.names.length) {
        await queryRunner.manager.delete(KeywordsEntity, {
          thesisKeywordId: thesisKeyword.id,
        });

        const newKeywords = req.names.map((name) => ({
          name,
          thesisKeywordId: thesisKeyword.id,
        }));
        await queryRunner.manager.insert(KeywordsEntity, newKeywords);
      }

      await queryRunner.commitTransaction();

      return {
        data: thesisKeyword as unknown as IThesisKeyword,
      };
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async Delete(
    thesisKeywordId: number,
    req: DeleteThesisKeywordDto,
  ): Promise<Record<string, IThesisKeyword[] | IThesisKeyword>> {
    try {
      if (
        Array.isArray(req.thesisKeywordIds) &&
        req.thesisKeywordIds.length > 0
      ) {
        const foundThesisKeywords = await this.thesisKeywordRepository.find({
          where: { id: In(req.thesisKeywordIds) },
          relations: ['keyword'],
        });
        if (!foundThesisKeywords.length) {
          throw new NotFoundException('Thesis keyword not found');
        }

        await this.thesisKeywordRepository.delete(req.thesisKeywordIds);

        return {
          data: foundThesisKeywords.map((thesis) => ({
            id: thesis.id,
            createdAt: thesis.createdAt,
            updatedAt: thesis.updatedAt,
            deletedAt: thesis.deletedAt,
          })) as unknown as IThesisKeyword[],
        };
      } else {
        const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
          where: { id: thesisKeywordId },
          relations: ['keyword'],
        });
        if (!foundThesisKeyword) {
          throw new NotFoundException('Thesis keyword not found');
        }

        await this.thesisKeywordRepository.delete(thesisKeywordId);

        return {
          data: CreateThesisKeywordDto.toResponse(
            foundThesisKeyword,
          ) as unknown as IThesisKeyword,
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
