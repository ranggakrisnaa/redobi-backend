import data from '@/database/dummies/criteria.json';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { CriteriaEntity } from '../entities/criteria.entity';
import { SubCriteriaEntity } from '../entities/sub-criteria.entity';
import { CriteriaTypeEnum } from '../enums/criteria-type.enum';

export class CriteriaSeeder1746769058635 implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const repository = dataSource.getRepository(CriteriaEntity);
    const subCriteriaRepo = dataSource.getRepository(SubCriteriaEntity);
    for (const criteriaData of data) {
      const { subCriteria, ...rest } = criteriaData;
      const foundCriteria = await repository.findOne({
        where: { name: criteriaData.name },
      });
      if (!foundCriteria) {
        const data = await repository.save({
          ...rest,
          type: rest.type as CriteriaTypeEnum,
        });

        const subCriteriaEntities = subCriteria.map((sub) => ({
          ...sub,
          criteriaId: data.id,
        }));
        await subCriteriaRepo.save(subCriteriaEntities);
      }
    }
  }
}
