import { IBaseEntity } from './base-entity.interface';
import { IThesisKeyword } from './thesis-keyword-entity.interface';

export interface IKeyword extends IBaseEntity {
  id: number;
  name: string;
  thesisKeywordId: number;
  thesisKeyword?: IThesisKeyword;
}
