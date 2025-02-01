import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ThesisKeywordCategoryEnum } from '../enums/thesis-keyword-category.enum';
import { IKeyword } from '../interface-model/keyword-entity.interface';
import { KeywordsEntity } from './keyword.entity';

@Entity('thesis_keywords')
export class ThesisKeywordsEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_thesis_keyword_id',
  })
  id: number;

  @Column({ type: 'enum', enum: ThesisKeywordCategoryEnum })
  category: ThesisKeywordCategoryEnum;

  @OneToMany(() => KeywordsEntity, (keyword) => keyword.thesisKeyword)
  keyword?: IKeyword[];
}
