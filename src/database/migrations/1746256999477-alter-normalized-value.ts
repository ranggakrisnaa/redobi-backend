import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterNormalizedValue1746256999477 implements MigrationInterface {
  name = 'AlterNormalizedValue1746256999477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix" DROP COLUMN "normalized_value"
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix"
            ADD "normalized_value" numeric(5, 2) NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix" DROP COLUMN "normalized_value"
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix"
            ADD "normalized_value" integer NOT NULL
        `);
  }
}
