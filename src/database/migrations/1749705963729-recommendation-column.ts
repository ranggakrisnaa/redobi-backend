import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecommendationColumn1749705963729 implements MigrationInterface {
  name = 'RecommendationColumn1749705963729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recommendations_position_enum" AS ENUM('Pembimbing 1', 'Pembimbing 2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "recommendations" ADD "position" "public"."recommendations_position_enum" NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recommendations" DROP COLUMN "position"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recommendations_position_enum"`,
    );
  }
}
