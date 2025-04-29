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
import { UpdateThesisKeywordDto } from './dto/update.dto';
import { ThesisKeywordRepository } from './thesis-keyword.repository';

@Injectable()
export class ThesisKeywordService {
  constructor(
    private readonly thesisKeywordRepository: ThesisKeywordRepository,
    private readonly keywordRepository: keywordRepository,
    private readonly dataSource: DataSource,
  ) {}

  async Pagination() {}

  async Detail() {}

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

      const keywordEntities = req.keywords.map((keyword) => ({
        id: keyword.id,
        name: keyword.name,
      }));

      await this.keywordRepository.updateWithTransaction(
        queryRunner,
        keywordEntities as unknown as IKeyword[],
      );
      await queryRunner.commitTransaction();

      return CreateThesisKeywordDto.toResponse({
        ...updateThesisKeyword,
        names: req.names,
      } as unknown as CreateThesisKeywordDto);
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unexpected error',
      );
    }
  }

  async Delete() {}
}
