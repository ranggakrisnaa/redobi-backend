import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSelectionsTable1739083765498 implements MigrationInterface {
  name = 'CreateSelectionsTable1739083765498';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "selections" (
                "id" SERIAL NOT NULL,
                "student_id" uuid NOT NULL,
                "lecturer_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_selections_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "selections"
            ADD CONSTRAINT "FK_selection_students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "selections"
            ADD CONSTRAINT "FK_selection_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "selections" DROP CONSTRAINT "FK_selection_lecturers"
        `);
    await queryRunner.query(`
            ALTER TABLE "selections" DROP CONSTRAINT "FK_selection_students"
        `);
    await queryRunner.query(`
            DROP TABLE "selections"
        `);
  }
}
