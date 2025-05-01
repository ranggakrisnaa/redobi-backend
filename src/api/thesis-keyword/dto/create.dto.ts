import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { EnumField, StringField } from '@/decorators/field.decorators';

export class CreateThesisKeywordDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  @EnumField(() => ThesisKeywordCategoryEnum)
  @StringField()
  category: ThesisKeywordCategoryEnum;

  @StringField({ each: true })
  names: string[];

  static toResponse(dto: CreateThesisKeywordDto) {
    return dto?.names.map((name) => ({
      id: dto.id,
      category: dto.category,
      name: name,
    }));
  }
}
