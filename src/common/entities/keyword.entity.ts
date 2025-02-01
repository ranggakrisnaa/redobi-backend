import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IThesisKeyword } from '../interface-model/thesis_keyword-entity.interface';
import { ThesisKeywordsEntity } from './thesis_keyword.entity';

@Entity('keywords')
export class KeywordsEntity extends AbstractEntity {
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
