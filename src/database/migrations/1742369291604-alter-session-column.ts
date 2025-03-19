import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSessionColumn1742369291604 implements MigrationInterface {
  name = 'AlterSessionColumn1742369291604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions"
                RENAME COLUMN "hash_token" TO "refresh_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD "valid_otp_until" TIMESTAMP WITH TIME ZONE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions"
                RENAME COLUMN "refresh_token" TO "hash_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "sessions" DROP COLUMN "valid_otp_until"
        `);
  }
}
