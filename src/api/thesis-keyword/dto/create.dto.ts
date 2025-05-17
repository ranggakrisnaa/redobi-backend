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

  static toResponse(dto: Partial<CreateThesisKeywordDto>) {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updateAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
