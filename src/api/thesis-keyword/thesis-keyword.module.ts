import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { ThesisKeywordsEntity } from '@/database/entities/thesis-keyword.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { keywordRepository } from '../keyword/keyword.repository';
import { ThesisKeywordController } from './thesis-keyword.controller';
import { ThesisKeywordRepository } from './thesis-keyword.repository';
import { ThesisKeywordService } from './thesis-keyword.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThesisKeywordsEntity, KeywordsEntity])],
  controllers: [ThesisKeywordController],
  providers: [ThesisKeywordService, ThesisKeywordRepository, keywordRepository],
})
export class ThesisKeywordModule {}
