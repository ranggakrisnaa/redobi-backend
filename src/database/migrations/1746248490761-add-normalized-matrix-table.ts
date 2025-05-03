import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNormalizedMatrixTable1746248490761
  implements MigrationInterface
{
  name = 'AddNormalizedMatrixTable1746248490761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "normalized_matrix" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lecturer_id" uuid NOT NULL,
                "criteria_id" integer NOT NULL,
                "normalized_value" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_normalized_matrix_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix"
            ADD CONSTRAINT "FK_normalized_matrix_lecturer" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix"
            ADD CONSTRAINT "FK_normalized_matrix_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix" DROP CONSTRAINT "FK_normalized_matrix_criteria"
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrix" DROP CONSTRAINT "FK_normalized_matrix_lecturer"
        `);
    await queryRunner.query(`
            DROP TABLE "normalized_matrix"
        `);
  }
}
