import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAssessmentTable1745731904136 implements MigrationInterface {
  name = 'AlterAssessmentTable1745731904136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "score"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "score" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "score"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "score" numeric(5,2) NOT NULL`,
    );
  }
}
