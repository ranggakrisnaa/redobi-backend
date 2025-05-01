import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { IKeyword } from '@/database/interface-model/keyword-entity.interface';
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

  async Pagination(reqQuery: ThesisKeywordReqQuery) {
    return this.thesisKeywordRepository.Pagination(reqQuery);
  }

  async Detail(thesisKeywordId: number) {
    const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
      where: {
        id: thesisKeywordId,
      },
      relations: ['keyword'],
    });
    if (!foundThesisKeyword) {
      throw new BadRequestException('Thesis keyword is not found');
    }

    return foundThesisKeyword;
  }

  async Create(req: CreateThesisKeywordDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
        where: {
          category: req.category as ThesisKeywordCategoryEnum,
          keyword: {
            name: In(req.names),
          },
        },
      });
      if (foundThesisKeyword) {
        throw new BadRequestException('Thesis keyword already exists');
      }

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

      return CreateThesisKeywordDto.toResponse({
        ...newThesisKeyword,
        names: req.names,
      } as unknown as CreateThesisKeywordDto);
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async Update(thesisKeywordId: number, req: UpdateThesisKeywordDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
        where: { id: thesisKeywordId },
        relations: ['keyword'],
      });
      if (!foundThesisKeyword) {
        throw new NotFoundException('Thesis keyword not found');
      }

      const updateThesisKeyword =
        await this.thesisKeywordRepository.updateWithTransaction(queryRunner, {
          ...foundThesisKeyword,
          ...req,
        });

      const existKeywordId = foundThesisKeyword.keyword.map((k) => k.id);
      const receiveKeywordId = req.keywords.map((k) => k.id);
      const toDelete = existKeywordId.filter(
        (id) => !receiveKeywordId.includes(id.toString()),
      );
      if (toDelete.length > 0) {
        await this.keywordRepository.delete(toDelete);
      }

      for (const keywordData of req.keywords) {
        if (keywordData.id) {
          // Update existing keyword
          await queryRunner.manager.update(
            KeywordsEntity,
            { id: keywordData.id },
            {
              name: keywordData.name,
              thesisKeywordId: thesisKeywordId,
            },
          );
        } else {
          // Create new keyword
          const newKeyword = this.keywordRepository.create({
            name: keywordData.name,
            thesisKeywordId: thesisKeywordId,
          });
          await queryRunner.manager.save(newKeyword);
        }
      }
      await queryRunner.commitTransaction();

      return CreateThesisKeywordDto.toResponse({
        ...updateThesisKeyword,
        names: req.keywords.map((k) => k.name),
      } as unknown as CreateThesisKeywordDto);
    } catch (err: unknown) {
      if (err instanceof InternalServerErrorException)
        throw new InternalServerErrorException(
          err instanceof Error ? err.message : 'Unexpected error',
        );

      throw err;
    }
  }

  async Delete(thesisKeywordId: number, req: DeleteThesisKeywordDto) {
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

        return foundThesisKeywords.map((thesis) => {
          return CreateThesisKeywordDto.toResponse({
            ...thesis,
            names: thesis.keyword.map((k) => k.name),
          } as unknown as CreateThesisKeywordDto);
        });
      } else {
        const foundThesisKeyword = await this.thesisKeywordRepository.findOne({
          where: { id: thesisKeywordId },
          relations: ['keyword'],
        });
        if (!foundThesisKeyword) {
          throw new NotFoundException('Thesis keyword not found');
        }

        await this.thesisKeywordRepository.delete(thesisKeywordId);

        return CreateThesisKeywordDto.toResponse({
          ...foundThesisKeyword,
          names: foundThesisKeyword.keyword.map((k) => k.name),
        });
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
