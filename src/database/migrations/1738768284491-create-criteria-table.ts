import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCriteriaTable1738768284491 implements MigrationInterface {
  name = 'CreateCriteriaTable1738768284491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."criteria_type_enum" AS ENUM('Benefit', 'Cost')
        `);
    await queryRunner.query(`
            CREATE TABLE "criteria" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "weight" numeric(5, 2) NOT NULL,
                "type" "public"."criteria_type_enum" NOT NULL,
                "sub_criteria_id" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_criteria_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "criteria"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."criteria_type_enum"
        `);
  }
}
