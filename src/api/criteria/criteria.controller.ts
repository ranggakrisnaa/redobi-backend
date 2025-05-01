import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ICriteria } from '@/database/interface-model/criteria-entity.interface';
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
import { CriteriaService } from './criteria.service';
import { CreateCriteriaDto } from './dto/create.dto';
import { DeleteCriteriaDto } from './dto/delete.dto';
import { CriteriaPaginationReqQuery } from './dto/query.dto';
import { UpdateCriteriaDto } from './dto/update.dto';

@ApiTags('criteria')
@Controller({
  path: 'criteria',
  version: '1',
})
@UseGuards(AuthGuard)
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @ApiAuth({
    summary: 'Get all criteria',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: CriteriaPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ICriteria>> {
    return await this.criteriaService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Get detail criteria',
  })
  @Get(':criteriaId')
  async Detail(@Param('criteriaId') criteriaId: string): Promise<ICriteria> {
    return await this.criteriaService.Detail(Number.parseInt(criteriaId));
  }

  @ApiAuth({
    type: CreateCriteriaDto,
    summary: 'Create criteria',
  })
  @Post()
  async Create(@Body() req: CreateCriteriaDto): Promise<Partial<ICriteria>> {
    return await this.criteriaService.Create(req);
  }

  @ApiAuth({
    type: UpdateCriteriaDto,
    summary: 'Update criteria',
  })
  @Put(':criteriaId')
  async Update(
    @Body() req: UpdateCriteriaDto,
    @Param('criteriaId') criteriaId: string,
  ): Promise<ICriteria> {
    return await this.criteriaService.Update(req, Number.parseInt(criteriaId));
  }

  @ApiAuth({
    summary: 'Delete criteria',
  })
  @Delete(':criteriaId?')
  async Delete(
    @Param('criteriaId') criteriaId: string,
    @Body() req: DeleteCriteriaDto,
  ): Promise<Partial<ICriteria> | Partial<ICriteria>[]> {
    return await this.criteriaService.Delete(+criteriaId, req);
  }
}
