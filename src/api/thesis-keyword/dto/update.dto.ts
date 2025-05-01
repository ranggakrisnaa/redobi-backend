import { UpdateKeywordDto } from '@/api/keyword/dto/update.keyword';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateThesisKeywordDto } from './create.dto';

export class UpdateThesisKeywordDto extends PartialType(
  CreateThesisKeywordDto,
) {
  @ValidateNested({ each: true })
  @Type(() => UpdateKeywordDto)
  @ArrayMinSize(1, {
    message: 'At least 1 keyword must be filled.',
  })
  keywords: UpdateKeywordDto[];
}
