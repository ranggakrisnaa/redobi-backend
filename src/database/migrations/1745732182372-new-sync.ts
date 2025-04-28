import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewSync1745732182372 implements MigrationInterface {
  name = 'NewSync1745732182372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "sub_criteria_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "sub_criteria_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
