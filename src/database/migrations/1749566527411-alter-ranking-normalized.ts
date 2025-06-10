import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRankingNormalized1749566527411 implements MigrationInterface {
  name = 'AlterRankingNormalized1749566527411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices" FOREIGN KEY ("normalized_matrices_id") REFERENCES "normalized_matrices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices" FOREIGN KEY ("ranking_matrices_id") REFERENCES "ranking_matrices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices" FOREIGN KEY ("normalized_matrices_id") REFERENCES "normalized_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices" FOREIGN KEY ("ranking_matrices_id") REFERENCES "ranking_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
