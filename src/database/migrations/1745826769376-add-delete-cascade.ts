import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteCascade1745826769376 implements MigrationInterface {
  name = 'AddDeleteCascade1745826769376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" DROP CONSTRAINT "FK_criteria_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria_assessments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" ADD CONSTRAINT "FK_criteria_sub_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria_assessments" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria_assessments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" DROP CONSTRAINT "FK_criteria_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria_assessments" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" ADD CONSTRAINT "FK_criteria_sub_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
