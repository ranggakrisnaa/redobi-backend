import { ApiAuth } from '@/decorators/http.decorators';
import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReccomendationService } from './reccomendation.service';

@ApiTags('reccomendations')
@Controller({
  path: 'reccomendations',
  version: '1',
})
export class ReccomendationController {
  constructor(private readonly reccomendationService: ReccomendationService) {}

  async Pagination() {
    await this.reccomendationService.Pagination();
  }

  async Detail() {
    await this.reccomendationService.Detail();
  }

  @ApiAuth({
    summary: 'Get detail criteria',
  })
  @Post()
  async Create() {
    // @Body() req: CreateReccomendationDto
    await this.reccomendationService.Create();
  }

  @ApiAuth({
    summary: 'Get detail criteria',
  })
  @Post('/normalized')
  async CreateNormalizeMatrix() {
    await this.reccomendationService.CreateNormalizationMatrix();
  }

  @ApiAuth({
    summary: 'Get detail criteria',
  })
  @Post('/rank')
  async NormalizationMatricesRanking() {
    await this.reccomendationService.NormalizationMatricesRanking();
  }

  async Update() {
    await this.reccomendationService.Update();
  }

  async Delete() {
    await this.reccomendationService.Delete();
  }
}
