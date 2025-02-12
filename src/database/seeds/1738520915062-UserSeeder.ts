import { UserEntity } from '@/common/entities/user.entity';
import { hashPassword } from '@/utils/password.util';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import data from '../dummies/admin.json';

export class UserSeeder implements Seeder {
  track = false;

  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);

    // Pastikan data dalam format yang benar sebelum diproses
    const adminData =
      Array.isArray(data) && data.length > 0 && Array.isArray(data[0].data)
        ? data[0].data.map((admin) => ({
            fullName: admin.full_name,
            email: admin.email,
            username: admin.username,
            password: admin.password,
          }))
        : [];

    if (adminData.length === 0) {
      console.warn('No admin data found in admin.json');
      return;
    }

    for (const admin of adminData) {
      const foundAdmin = await repository.findOneBy({
        username: admin.username,
      });
      if (!foundAdmin) {
        const user = new UserEntity();
        user.username = admin.username;
        user.fullName = admin.fullName;
        user.email = admin.email;
        user.password = await hashPassword(admin.password);
        user.imageUrl = '';

        await repository.save(user);
      }
    }
  }
}
