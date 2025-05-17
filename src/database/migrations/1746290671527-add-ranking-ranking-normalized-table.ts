import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRankingRankingNormalizedTable1746290671527
  implements MigrationInterface
{
  name = 'AddRankingRankingNormalizedTable1746290671527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE "normalized_matrix"
    `);
    await queryRunner.query(`
            CREATE TABLE "ranking_matrices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lecturer_id" uuid NOT NULL,
                "final_score" numeric(5, 2) NOT NULL,
                "rank" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_ranking_Matrix_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "ranking_normalized_matrices" (
                "id" SERIAL NOT NULL,
                "normalized_matrices_id" uuid NOT NULL,
                "ranking_matrices_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_ranking_normalized_matrices_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "normalized_matrices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lecturer_id" uuid NOT NULL,
                "criteria_id" integer NOT NULL,
                "normalized_value" numeric(5, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_normalized_matrices_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_matrices"
            ADD CONSTRAINT "FK_ranking_matrix_lecturer" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_normalized_matrices"
            ADD CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices" FOREIGN KEY ("normalized_matrices_id") REFERENCES "normalized_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_normalized_matrices"
            ADD CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices" FOREIGN KEY ("ranking_matrices_id") REFERENCES "ranking_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices"
            ADD CONSTRAINT "FK_normalized_matrices_lecturer" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices"
            ADD CONSTRAINT "FK_normalized_matrices_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices" DROP CONSTRAINT "FK_normalized_matrices_criteria"
        `);
    await queryRunner.query(`
            ALTER TABLE "normalized_matrices" DROP CONSTRAINT "FK_normalized_matrices_lecturer"
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices"
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices"
        `);
    await queryRunner.query(`
            ALTER TABLE "ranking_matrices" DROP CONSTRAINT "FK_ranking_matrix_lecturer"
        `);
    await queryRunner.query(`
            DROP TABLE "normalized_matrices"
        `);
    await queryRunner.query(`
            DROP TABLE "ranking_normalized_matrices"
        `);
    await queryRunner.query(`
            DROP TABLE "ranking_matrices"
        `);
  }
}
