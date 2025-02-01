import { UserEntity } from '@/common/entities/user.entity';
import { IUser } from '@/common/interface-model/user-entity.interface';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import data from '../dummies/admin.json';

export class UserSeeder implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);

    const adminData = data as unknown as IUser[];

    const createUser = adminData.map((user) => {
      const foundAdmin = repository.findOneBy({ username: user.username });
      if (!foundAdmin) {
      }
    });
  }
}
