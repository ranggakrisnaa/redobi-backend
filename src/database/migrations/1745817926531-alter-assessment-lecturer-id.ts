import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAssessmentLecturerId1745817926531
  implements MigrationInterface
{
  name = 'AlterAssessmentLecturerId1745817926531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP COLUMN "lecturer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "lecturer_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "lecturer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD "lecturer_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
