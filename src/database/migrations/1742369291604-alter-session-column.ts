import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSessionColumn1742369291604 implements MigrationInterface {
  name = 'AlterSessionColumn1742369291604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions"
                RENAME COLUMN "hash_token" TO "refresh_token"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions"
                RENAME COLUMN "refresh_token" TO "hash_token"
        `);
  }
}
