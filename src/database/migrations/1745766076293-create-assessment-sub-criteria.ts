import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessmentSubCriteria1745766076293
  implements MigrationInterface
{
  name = 'CreateAssessmentSubCriteria1745766076293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assessment_sub_criteria" ("id" SERIAL NOT NULL, "lecturer_id" uuid NOT NULL, "sub_criteria_id" integer NOT NULL, "assessment_id" uuid NOT NULL, "score" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_assessment_sub_criteria_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "lecturer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "sub_criteria_id"`,
    );
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "score"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "PK_assessments_id"`,
    );
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "PK_assessments_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" DROP CONSTRAINT "PK_selections_id"`,
    );
    await queryRunner.query(`ALTER TABLE "selections" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "selections" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" ADD CONSTRAINT "PK_selections_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reccomendations" DROP CONSTRAINT "PK_reccomendations_id"`,
    );
    await queryRunner.query(`ALTER TABLE "reccomendations" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "reccomendations" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "reccomendations" ADD CONSTRAINT "PK_reccomendations_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria_assessments" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria_assessments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reccomendations" DROP CONSTRAINT "PK_reccomendations_id"`,
    );
    await queryRunner.query(`ALTER TABLE "reccomendations" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "reccomendations" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "reccomendations" ADD CONSTRAINT "PK_reccomendations_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" DROP CONSTRAINT "PK_selections_id"`,
    );
    await queryRunner.query(`ALTER TABLE "selections" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "selections" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" ADD CONSTRAINT "PK_selections_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "PK_assessments_id"`,
    );
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "PK_assessments_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "score" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "sub_criteria_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "lecturer_id" uuid NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "assessment_sub_criteria"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
