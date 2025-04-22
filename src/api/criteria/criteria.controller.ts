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
import { LecturerPaginationReqQuery } from '../lecturer/dto/query.dto';
import { CriteriaService } from './criteria.service';
import { CreateCriteriaDto } from './dto/create.dto';
import { DeleteCriteriaDto } from './dto/delete.dto';
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
    type: CreateCriteriaDto,
    summary: 'Create criteria',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: LecturerPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<ICriteria>> {
    return await this.criteriaService.Pagination(reqQuery);
  }

  async Detail() {}

  @ApiAuth({
    type: CreateCriteriaDto,
    summary: 'Create criteria',
  })
  @Post()
  async Create(@Body() req: CreateCriteriaDto) {
    return await this.criteriaService.Create(req);
  }

  @ApiAuth({
    type: UpdateCriteriaDto,
    summary: 'Create criteria',
  })
  @Put(':criteriaId')
  async Update(
    @Body() req: UpdateCriteriaDto,
    @Param('criteriaId') criteriaId: string,
  ) {
    return await this.criteriaService.Update(req, +criteriaId);
  }

  @ApiAuth({
    summary: 'Delete criteria',
  })
  @Delete(':criteriaId?')
  async Delete(
    @Param('criteriaId') criteriaId: string,
    @Body() req: DeleteCriteriaDto,
  ) {
    return await this.criteriaService.Delete(+criteriaId, req);
  }
}
