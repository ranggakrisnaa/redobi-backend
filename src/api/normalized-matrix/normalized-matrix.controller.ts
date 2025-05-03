import { Controller } from '@nestjs/common';
import { NormalizedMatrixService } from './normalized-matrix.service';

@Controller('normalized-matrix')
export class NormalizedMatrixController {
  constructor(
    private readonly normalizedMatrixService: NormalizedMatrixService,
  ) {}
}
