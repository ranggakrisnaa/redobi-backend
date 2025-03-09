import { Module } from '@nestjs/common';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';

@Module({
  controllers: [LecturerController],
  providers: [LecturerService],
})
export class LecturerModule {}
