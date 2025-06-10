import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '@/database/interface-model/ranking-matrices-entity.interface';
import { IRecommendation } from '@/database/interface-model/recommendation-entity.interface';
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
import { DeleteNormalizedMatrix } from '../normalized-matrix/dto/delete.dto';
import { DeleteRankingMatrix } from '../ranking-matrices/dto/delete.dto';
import { DeleteRecommendationDto } from './dto/delete.dto';
import { RecommendationPaginationReqQuery } from './dto/query.dto';
import { UpdateRecommendationDto } from './dto/update.dto';
import { RecommendationService } from './recommendation.service';

@ApiTags('recommendations')
@Controller({
  path: 'recommendations',
  version: '1',
})
@UseGuards(AuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @ApiAuth({
    summary: 'Pagination recomendation',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: RecommendationPaginationReqQuery,
  ): Promise<
    OffsetPaginatedDto<INormalizedMatrices | IRankingMatrices | IRecommendation>
  > {
    return await this.recommendationService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Create recommendation',
  })
  @Post()
  async CreateRecommendation() {
    return await this.recommendationService.CreateRecommendation();
  }

  @ApiAuth({
    summary: 'Create normalization',
  })
  @Post('/normalized')
  async CreateNormalizationMatrix() {
    return await this.recommendationService.CreateNormalizationMatrix();
  }

  @ApiAuth({
    summary: 'Ranking normalization',
  })
  @Post('/rank')
  async NormalizationMatrixRanking() {
    return await this.recommendationService.NormalizationMatrixRanking();
  }

  @ApiAuth({
    summary: 'Update Recommendation',
  })
  @Put(':recommendationId?')
  async UpdateRecommendation(
    @Body() req: UpdateRecommendationDto,
    @Param('reccomendationId') reccomendationId: string,
  ) {
    return await this.recommendationService.UpdateRecommendation(
      reccomendationId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Normalization Matrix',
  })
  @Delete('normalized/:normalizedMatrixId?')
  async DeleteNormalizationMatrix(
    @Param('normalizedMatrixId') normalizedMatrixId: string,
    @Body() req: DeleteNormalizedMatrix,
  ) {
    return await this.recommendationService.DeleteNormalizationMatrix(
      normalizedMatrixId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Ranking Matrix',
  })
  @Delete('ranking/:rankingMatrixId?')
  async DeleteRankingMatrix(
    @Param('rankingMatrixId') rankingMatrixId: string,
    @Body() req: DeleteRankingMatrix,
  ) {
    return await this.recommendationService.DeleteRankingMatrix(
      rankingMatrixId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Reccomendation',
  })
  @Delete(':recommendationId?')
  async DeleteRecommendation(
    @Param('recommendationId') recommendationId: string,
    @Body() req: DeleteRecommendationDto,
  ) {
    return await this.recommendationService.DeleteRecommendation(
      recommendationId,
      req,
    );
  }
}
