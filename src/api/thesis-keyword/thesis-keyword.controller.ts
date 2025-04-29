import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateThesisKeywordDto } from './dto/create.dto';
import { UpdateThesisKeywordDto } from './dto/update.dto';
import { ThesisKeywordService } from './thesis-keyword.service';

@ApiTags('thesis-keywords')
@Controller({
  path: 'thesis-keywords',
  version: '1',
})
export class ThesisKeywordController {
  constructor(private readonly thesisKeywordService: ThesisKeywordService) {}

  async Pagination() {}

  async Detail() {}

  @ApiAuth({
    summary: 'Create Thesis Keyword',
    type: CreateThesisKeywordDto,
  })
  @Post()
  async Create(@Body() req: CreateThesisKeywordDto) {
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
  ) {
    return await this.thesisKeywordService.Update(+thesisKeywordId, req);
  }

  async Delete() {}
}
