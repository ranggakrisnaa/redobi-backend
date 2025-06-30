import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrecisionNormalized1751262690093 implements MigrationInterface {
  name = 'AddPrecisionNormalized1751262690093';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices"
            ALTER COLUMN "normalized_value" TYPE numeric(10, 3)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices"
            ALTER COLUMN "normalized_value" TYPE numeric(5, 2)
        `);
  }
}
