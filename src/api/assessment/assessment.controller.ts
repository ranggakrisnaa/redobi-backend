import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { IAssessment } from '@/database/interface-model/assessment-entity.interface';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create.dto';
import { DeleteAssessmentDto } from './dto/delete.dto';
import { AssessmentPaginationReqQuery } from './dto/query.dto';
import { UpdateAssessmentDto } from './dto/update.dto';

@ApiTags('assessments')
@Controller({
  path: 'assessments',
  version: '1',
})
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @ApiAuth({
    summary: 'Pagination Assessment',
  })
  @Get()
  async Pagination(
    @Query() reqQuery: AssessmentPaginationReqQuery,
  ): Promise<OffsetPaginatedDto<IAssessment>> {
    return await this.assessmentService.Pagination(reqQuery);
  }

  @ApiAuth({
    summary: 'Pagination Assessment',
  })
  @Get(':assessmentId')
  async Detail(
    @Param('assessmentId') assessmentId: string,
  ): Promise<Record<any, IAssessment>> {
    return await this.assessmentService.Detail(assessmentId);
  }

  @ApiAuth({
    summary: 'Create Assessment',
    type: CreateAssessmentDto,
  })
  @Post()
  async Create(
    @Body() req: CreateAssessmentDto,
  ): Promise<Record<string, IAssessment>> {
    return await this.assessmentService.Create(req);
  }

  @ApiAuth({
    summary: 'Update Assessment',
    type: UpdateAssessmentDto,
  })
  @Put(':assessmentId')
  async Update(
    @Body() req: UpdateAssessmentDto,
    @Param('assessmentId') assessmentId: string,
  ): Promise<Record<string, IAssessment>> {
    return await this.assessmentService.Update(req, assessmentId);
  }

  @ApiAuth({
    summary: 'Delete Assessment',
    type: DeleteAssessmentDto,
  })
  @Delete(':assessmentId?')
  async Delete(
    @Param('assessmentId') assessmentId: string,
    @Body() req: DeleteAssessmentDto,
  ): Promise<Record<string, IAssessment[] | IAssessment>> {
    return await this.assessmentService.Delete(assessmentId, req);
  }
}
