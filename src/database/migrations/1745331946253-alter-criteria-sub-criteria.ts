import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCriteriaSubCriteria1745331946253
  implements MigrationInterface
{
  name = 'AlterCriteriaSubCriteria1745331946253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "criteria" DROP CONSTRAINT "FK_criteria_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" DROP COLUMN "sub_criteria_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" ADD "criteria_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" ADD CONSTRAINT "FK_criteria_sub_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" DROP CONSTRAINT "FK_criteria_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" DROP COLUMN "criteria_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD "sub_criteria_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "criteria" ADD CONSTRAINT "FK_criteria_users" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
