import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IThesisKeyword } from '@/database/interface-model/thesis-keyword-entity.interface';
import { ApiAuth } from '@/decorators/http.decorators';
import { AuthGuard } from '@/guards/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateThesisKeywordDto } from './dto/create.dto';
import { DeleteThesisKeywordDto } from './dto/delete.dto';
import { ThesisKeywordReqQuery } from './dto/query.dto';
import { UpdateThesisKeywordDto } from './dto/update.dto';
import { ThesisKeywordService } from './thesis-keyword.service';

@ApiTags('thesis-keywords')
@Controller({
  path: 'thesis-keywords',
  version: '1',
})
@UseGuards(AuthGuard)
export class ThesisKeywordController {
  constructor(private readonly thesisKeywordService: ThesisKeywordService) {}

  @ApiAuth({
    summary: 'Pagination Thesis Keyword',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: ThesisKeywordReqQuery,
  ): Promise<OffsetPaginatedDto<IThesisKeyword>> {
    return await this.thesisKeywordService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Pagination Thesis Keyword',
  })
  @Get(':thesisKeywordId')
  async Detail(
    @Param('thesisKeywordId') thesisKeywordId: string,
  ): Promise<Record<string, IThesisKeyword>> {
    return await this.thesisKeywordService.Detail(
      Number.parseInt(thesisKeywordId),
    );
  }

  @ApiAuth({
    summary: 'Create Thesis Keyword',
    type: CreateThesisKeywordDto,
  })
  @Post()
  async Create(
    @Body() req: CreateThesisKeywordDto,
  ): Promise<Record<string, Partial<CreateThesisKeywordDto>>> {
    return await this.thesisKeywordService.Create(req);
  }

  @ApiAuth({
    summary: 'Update Thesis Keyword',
    type: UpdateThesisKeywordDto,
  })
  @Put(':thesisKeywordId')
  async Update(
    @Param('thesisKeywordId') thesisKeywordId: string,
    @Body() req: UpdateThesisKeywordDto,
  ): Promise<Record<any, Partial<UpdateThesisKeywordDto>>> {
    return await this.thesisKeywordService.Update(+thesisKeywordId, req);
  }

  @ApiAuth({
    summary: 'Pagination Thesis Keyword',
  })
  @Delete(':thesisKeywordId?')
  async Delete(
    @Param('thesisKeywordId') thesisKeywordId: string,
    @Body() req: DeleteThesisKeywordDto,
  ): Promise<Record<string, IThesisKeyword[] | IThesisKeyword>> {
    return await this.thesisKeywordService.Delete(
      Number.parseInt(thesisKeywordId),
      req,
    );
  }
}
