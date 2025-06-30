import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrecision1751262558387 implements MigrationInterface {
  name = 'AddPrecision1751262558387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "ranking_matrices"
            ALTER COLUMN "final_score" TYPE numeric(10, 3)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "ranking_matrices"
            ALTER COLUMN "final_score" TYPE numeric(5, 2)
        `);
  }
}
