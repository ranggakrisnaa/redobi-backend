import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatethesisKeywordsTable1739083547508
  implements MigrationInterface
{
  name = 'CreatethesisKeywordsTable1739083547508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."thesis_keywords_category_enum" AS ENUM(
                'Sistem Cerdas',
                'Rekayasa Perangkat Lunak',
                'Multimedia'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "thesis_keywords" (
                "id" SERIAL NOT NULL,
                "category" "public"."thesis_keywords_category_enum" NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_thesis_keyword_id" PRIMARY KEY ("id")
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
            DROP TABLE "thesis_keywords"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."thesis_keywords_category_enum"
        `);
  }
}
