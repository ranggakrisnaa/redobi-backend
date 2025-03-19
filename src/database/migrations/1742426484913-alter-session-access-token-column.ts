import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSessionAccessTokenColumn1742426484913
  implements MigrationInterface
{
  name = 'AlterSessionAccessTokenColumn1742426484913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD "access_token" character varying(255) NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions" DROP COLUMN "access_token"
        `);
  }
}
