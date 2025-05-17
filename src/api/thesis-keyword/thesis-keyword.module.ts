import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { SessionEntity } from '@/database/entities/session.entity';
import { ThesisKeywordsEntity } from '@/database/entities/thesis-keyword.entity';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { keywordRepository } from '../keyword/keyword.repository';
import { SessionRepository } from '../session/session.repository';
import { ThesisKeywordController } from './thesis-keyword.controller';
import { ThesisKeywordRepository } from './thesis-keyword.repository';
import { ThesisKeywordService } from './thesis-keyword.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ThesisKeywordsEntity,
      KeywordsEntity,
      SessionEntity,
    ]),
  ],
  controllers: [ThesisKeywordController],
  providers: [
    ThesisKeywordService,
    ThesisKeywordRepository,
    keywordRepository,
    SessionRepository,
    JwtService,
  ],
})
export class ThesisKeywordModule {}
