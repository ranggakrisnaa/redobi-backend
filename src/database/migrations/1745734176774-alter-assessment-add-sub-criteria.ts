import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAssessmentAddSubCriteria1745734176774
  implements MigrationInterface
{
  name = 'AlterAssessmentAddSubCriteria1745734176774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" RENAME COLUMN "criteria_id" TO "sub_criteria_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" RENAME COLUMN "sub_criteria_id" TO "criteria_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
