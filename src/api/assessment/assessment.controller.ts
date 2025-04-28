import { IAssessment } from '@/database/interface-model/assessment-entity.interface';
import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create.dto';
import { DeleteAssessmentDto } from './dto/delete.dto';
import { UpdateAssessmentDto } from './dto/update.dto';

@ApiTags('assessments')
@Controller({
  path: 'assessments',
  version: '1',
})
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @ApiAuth({
    summary: 'Create Assessment',
    type: CreateAssessmentDto,
  })
  @Post()
  async Create(
    @Body() req: CreateAssessmentDto,
  ): Promise<Partial<IAssessment>> {
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
  ) {
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
  ) {
    return await this.assessmentService.Delete(assessmentId, req);
  }
}
