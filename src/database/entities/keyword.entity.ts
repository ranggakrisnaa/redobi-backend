import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IKeyword } from '../interface-model/keyword-entity.interface';
import { IThesisKeyword } from '../interface-model/thesis-keyword-entity.interface';
import { AbstractEntity } from './abstract.entity';
import { ThesisKeywordsEntity } from './thesis-keyword.entity';

@Entity('keywords')
export class KeywordsEntity extends AbstractEntity implements IKeyword {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_keyword_id',
  })
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'int', name: 'thesis_keyword_id' })
  thesisKeywordId: number;

  @JoinColumn({
    name: 'thesis_keyword_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_keyword_thesis_keywords',
  })
  @ManyToOne(
    () => ThesisKeywordsEntity,
    (thesis_keyword) => thesis_keyword.keyword,
  )
  thesisKeyword!: IThesisKeyword;
}
