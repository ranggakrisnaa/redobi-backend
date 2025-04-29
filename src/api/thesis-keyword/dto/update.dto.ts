import { UpdateKeywordDto } from '@/api/keyword/dto/update.keyword';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, Validate } from 'class-validator';
import { CreateThesisKeywordDto } from './create.dto';

export class UpdateThesisKeywordDto extends PartialType(
  CreateThesisKeywordDto,
) {
  @Validate(() => UpdateKeywordDto, { each: true })
  @Type(() => UpdateKeywordDto)
  @ArrayMinSize(1, {
    message: 'At least 1 keyword must be filled.',
  })
  keywords: UpdateKeywordDto[];
}
