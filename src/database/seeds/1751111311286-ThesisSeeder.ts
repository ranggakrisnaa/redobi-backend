import data from '@/database/dummies/thesis.json';
import { KeywordsEntity } from '@/database/entities/keyword.entity';
import { ThesisKeywordsEntity } from '@/database/entities/thesis-keyword.entity';
import { ThesisKeywordCategoryEnum } from '@/database/enums/thesis-keyword-category.enum';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class ThesisSeeder1751111311286 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const thesisKeywordRepository =
      dataSource.getRepository(ThesisKeywordsEntity);
    const keywordRepository = dataSource.getRepository(KeywordsEntity);

    for (const thesisKeywordData of data) {
      const { keywords, ...rest } = thesisKeywordData;

      const foundThesisKeyword = await thesisKeywordRepository.findOne({
        where: { category: rest.category as ThesisKeywordCategoryEnum },
      });

      if (!foundThesisKeyword) {
        const savedThesisKeyword = await thesisKeywordRepository.save({
          ...rest,
          category: rest.category as ThesisKeywordCategoryEnum,
        });

        const keywordEntities = keywords.map((keywordName: string) => ({
          name: keywordName,
          thesisKeywordId: savedThesisKeyword.id,
        }));

        await keywordRepository.save(keywordEntities);
      }
    }
  }
}
