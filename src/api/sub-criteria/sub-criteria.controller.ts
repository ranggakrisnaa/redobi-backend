import { Controller } from '@nestjs/common';
import { SubCriteriaService } from './sub-criteria.service';

@Controller('sub-criteria')
export class SubCriteriaController {
  constructor(private readonly subCriteriaService: SubCriteriaService) {}
}
