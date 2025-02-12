import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssesmentsTable1739084915881 implements MigrationInterface {
  name = 'CreateAssesmentsTable1739084915881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "assessments" (
                "id" SERIAL NOT NULL,
                "lecturer_id" uuid NOT NULL,
                "criteria_id" integer NOT NULL,
                "sub_criteria_id" integer NOT NULL,
                "score" numeric(5, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_assessments_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_assessment_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_lecturers"
        `);
    await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_sub_criteria"
        `);
    await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_criteria"
        `);
    await queryRunner.query(`
            DROP TABLE "assessments"
        `);
  }
}
