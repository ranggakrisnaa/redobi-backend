import { ThesisKeywordCategoryEnum } from '../enums/thesis-keyword-category.enum';
import { IBaseEntity } from './base-entity.interface';
import { IKeyword } from './keyword-entity.interface';

export interface IThesisKeyword extends IBaseEntity {
  id: number;
  category: ThesisKeywordCategoryEnum;
  keyword?: IKeyword[];
}
