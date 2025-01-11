import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateThesisKeywordsTable1735752388706
  implements MigrationInterface
{
  name = 'CreateThesisKeywordsTable1735752388706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."thesis_keywords_category_enum" AS ENUM('Sistem Cerdas', 'Rekayasa Perangkat Lunak', 'Multimedia')`,
    );
    await queryRunner.query(
      `CREATE TABLE "thesis_keywords" ("id" SERIAL NOT NULL, "category" "public"."thesis_keywords_category_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_thesis_keyword_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "thesis_keywords"`);
    await queryRunner.query(
      `DROP TYPE "public"."thesis_keywords_category_enum"`,
    );
  }
}
