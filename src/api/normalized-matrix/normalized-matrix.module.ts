import { Module } from '@nestjs/common';
import { NormalizedMatrixController } from './normalized-matrix.controller';
import { NormalizedMatrixService } from './normalized-matrix.service';

@Module({
  controllers: [NormalizedMatrixController],
  providers: [NormalizedMatrixService],
})
export class NormalizedMatrixModule {}
