import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateReccomendationDto } from './dto/create.dto';
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
  async Create(@Body() req: CreateReccomendationDto) {
    await this.reccomendationService.Create(req);
  }

  @ApiAuth({
    summary: 'Get detail criteria',
  })
  @Post('/normalized')
  async CreateNormalizeMatrix() {
    await this.reccomendationService.CreateNormalizeMatrix();
  }

  async Update() {
    await this.reccomendationService.Update();
  }

  async Delete() {
    await this.reccomendationService.Delete();
  }
}
