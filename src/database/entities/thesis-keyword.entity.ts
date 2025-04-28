import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ThesisKeywordCategoryEnum } from '../enums/thesis-keyword-category.enum';
import { IKeyword } from '../interface-model/keyword-entity.interface';
import { IThesisKeyword } from '../interface-model/thesis-keyword-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { KeywordsEntity } from './keyword.entity';

@Entity('thesis_keywords')
export class ThesisKeywordsEntity
  extends AbstractEntity
  implements IThesisKeyword
{
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_thesis_keyword_id',
  })
  id: number;

  @Column({ type: 'enum', enum: ThesisKeywordCategoryEnum })
  category: ThesisKeywordCategoryEnum;

  @OneToMany(() => KeywordsEntity, (keyword) => keyword.thesisKeyword)
  keyword?: IKeyword[];
}
