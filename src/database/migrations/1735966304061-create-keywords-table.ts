import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKeywordsTable1735966304061 implements MigrationInterface {
  name = 'CreateKeywordsTable1735966304061';

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
    await queryRunner.query(`
            ALTER TABLE "keywords"
            ADD CONSTRAINT "FK_keyword_thesis_keywords" FOREIGN KEY ("thesis_keyword_id") REFERENCES "thesis_keywords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "keywords" DROP CONSTRAINT "FK_keyword_thesis_keywords"
        `);
    await queryRunner.query(`
            DROP TABLE "keywords"
        `);
  }
}
