import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDelCascadeKeywordColumn1745908191630
  implements MigrationInterface
{
  name = 'AddDelCascadeKeywordColumn1745908191630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "keywords" DROP CONSTRAINT "FK_keyword_thesis_keywords"
        `);
    await queryRunner.query(`
            ALTER TABLE "keywords"
            ADD CONSTRAINT "FK_keyword_thesis_keywords" FOREIGN KEY ("thesis_keyword_id") REFERENCES "thesis_keywords"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "keywords" DROP CONSTRAINT "FK_keyword_thesis_keywords"
        `);
    await queryRunner.query(`
            ALTER TABLE "keywords"
            ADD CONSTRAINT "FK_keyword_thesis_keywords" FOREIGN KEY ("thesis_keyword_id") REFERENCES "thesis_keywords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
