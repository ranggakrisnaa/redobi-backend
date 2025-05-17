import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { INormalizedMatrices } from '@/database/interface-model/normalized-matrices-entity.interface';
import { IRankingMatrices } from '@/database/interface-model/ranking-matrices-entity.interface';
import { IReccomendation } from '@/database/interface-model/reccomendation-entity.interface';
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
import { DeleteReccomendationDto } from './dto/delete.dto';
import { ReccomendationPaginationReqQuery } from './dto/query.dto';
import { UpdateReccomendationDto } from './dto/update.dto';
import { ReccomendationService } from './reccomendation.service';

@ApiTags('reccomendations')
@Controller({
  path: 'reccomendations',
  version: '1',
})
@UseGuards(AuthGuard)
export class ReccomendationController {
  constructor(private readonly reccomendationService: ReccomendationService) {}

  @ApiAuth({
    summary: 'Pagination reccomendation',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: ReccomendationPaginationReqQuery,
  ): Promise<
    OffsetPaginatedDto<INormalizedMatrices | IRankingMatrices | IReccomendation>
  > {
    return await this.reccomendationService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Create reccomendation',
  })
  @Post()
  async CreateReccomendation() {
    return await this.reccomendationService.CreateReccomendation();
  }

  @ApiAuth({
    summary: 'Create normalization',
  })
  @Post('/normalized')
  async CreateNormalizationMatrix() {
    return await this.reccomendationService.CreateNormalizationMatrix();
  }

  @ApiAuth({
    summary: 'Ranking normalization',
  })
  @Post('/rank')
  async NormalizationMatrixRanking() {
    return await this.reccomendationService.NormalizationMatrixRanking();
  }

  @ApiAuth({
    summary: 'Update Reccomendation',
  })
  @Put(':reccomendationId?')
  async UpdateReccomendation(
    @Body() req: UpdateReccomendationDto,
    @Param('reccomendationId') reccomendationId: string,
  ) {
    return await this.reccomendationService.UpdateReccomendation(
      reccomendationId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Normalization Matrix',
  })
  @Delete(':normalizedMatrixId?')
  async DeleteNormalizationMatrix(
    @Param('normalizedMatrixId') normalizedMatrixId: string,
    @Body() req: DeleteNormalizedMatrix,
  ) {
    return await this.reccomendationService.DeleteNormalizationMatrix(
      normalizedMatrixId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Ranking Matrix',
  })
  @Delete(':rankingMatrixId?')
  async DeleteRankingMatrix(
    @Param('rankingMatrixId') rankingMatrixId: string,
    @Body() req: DeleteRankingMatrix,
  ) {
    return await this.reccomendationService.DeleteRankingMatrix(
      rankingMatrixId,
      req,
    );
  }

  @ApiAuth({
    summary: 'Delete Reccomendation',
  })
  @Delete(':reccomendationId?')
  async DeleteReccomendation(
    @Param('reccomendationId') reccomendationId: string,
    @Body() req: DeleteReccomendationDto,
  ) {
    return await this.reccomendationService.DeleteReccomendation(
      reccomendationId,
      req,
    );
  }
}
