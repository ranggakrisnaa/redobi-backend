import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReccomendationsTable1739084188294
  implements MigrationInterface
{
  name = 'CreateReccomendationsTable1739084188294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "reccomendations" (
                "id" SERIAL NOT NULL,
                "student_id" uuid NOT NULL,
                "lecturer_id" uuid NOT NULL,
                "reccomendation_score" numeric(5, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_reccomendations_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "reccomendations"
            ADD CONSTRAINT "FK_reccomendation_students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reccomendations"
            ADD CONSTRAINT "FK_reccomendation_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "reccomendations" DROP CONSTRAINT "FK_reccomendation_lecturers"
        `);
    await queryRunner.query(`
            ALTER TABLE "reccomendations" DROP CONSTRAINT "FK_reccomendation_students"
        `);
    await queryRunner.query(`
            DROP TABLE "reccomendations"
        `);
  }
}
