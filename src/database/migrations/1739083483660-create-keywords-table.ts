import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKeywordsTable1739083483660 implements MigrationInterface {
  name = 'CreateKeywordsTable1739083483660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "keywords" (
                "id" SERIAL NOT NULL,
                "name" character varying(200) NOT NULL,
                "thesis_keyword_id" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_keyword_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "keywords"
        `);
  }
}
