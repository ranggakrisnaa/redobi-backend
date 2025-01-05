import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubCriteriaTable1735751797710 implements MigrationInterface {
  name = 'CreateSubCriteriaTable1735751797710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sub_criteria" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "weight" numeric(5,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_sub_criteria_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD "sub_criteria_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD CONSTRAINT "FK_criteria_users" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "criteria" DROP CONSTRAINT "FK_criteria_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" DROP COLUMN "sub_criteria_id"`,
    );
    await queryRunner.query(`DROP TABLE "sub_criteria"`);
  }
}
