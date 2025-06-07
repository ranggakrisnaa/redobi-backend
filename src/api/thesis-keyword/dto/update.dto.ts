import { PartialType } from '@nestjs/mapped-types';
import { CreateThesisKeywordDto } from './create.dto';

export class UpdateThesisKeywordDto extends PartialType(
  CreateThesisKeywordDto,
) {}
