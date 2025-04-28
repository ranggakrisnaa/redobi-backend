import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create.dto';

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
  async Create(@Body() req: CreateAssessmentDto) {
    return await this.assessmentService.Create(req);
  }

  @ApiAuth({
    summary: 'Update Assessment',
    type: CreateAssessmentDto,
  })
  @Post()
  async Update() {}
}
