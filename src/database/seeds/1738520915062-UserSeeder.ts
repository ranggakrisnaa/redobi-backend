import data from '@/database/dummies/admin.json';
import { hashPassword } from '@/utils/password.util';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserEntity } from '../entities/user.entity';
import { IUser } from '../interface-model/user-entity.interface';

export class UserSeeder1738520915062 implements Seeder {
  track = false;

  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);

    // Opsi 1: Jika data berupa array langsung
    const adminData = Array.isArray(data)
      ? data.map((admin: Partial<IUser>) => ({
          fullName: admin.fullName,
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
      // Validasi data sebelum processing
      if (!admin.username || !admin.email || !admin.password) {
        console.warn(`Skipping invalid admin data: ${JSON.stringify(admin)}`);
        continue;
      }

      const foundAdmin = await repository.findOneBy({
        username: admin.username,
      });

      if (!foundAdmin) {
        try {
          const user = new UserEntity();
          user.username = admin.username;
          user.fullName = admin.fullName || admin.username; // fallback jika fullName kosong
          user.email = admin.email;
          user.password = await hashPassword(admin.password);
          user.imageUrl = '';

          await repository.save(user);
          console.log(`User ${admin.username} created successfully`);
        } catch (error) {
          console.error(`Failed to create user ${admin.username}:`, error);
        }
      } else {
        console.log(`User ${admin.username} already exists, skipping...`);
      }
    }
  }
}
