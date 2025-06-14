import { ApiAuth } from '@/decorators/http.decorators';
import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticDataService } from './statistic-data.service';

@ApiTags('statistics')
@Controller({
  path: 'statistics',
  version: '1',
})
// @UseGuards(AuthGuard)
@Injectable()
export class StatisticDataController {
  constructor(private readonly statisticDataService: StatisticDataService) {}

  @ApiAuth({
    summary: 'Statistical Data',
  })
  @Get()
  async GetAllStatistics() {
    return await this.statisticDataService.GetAllStatistics();
  }
}
