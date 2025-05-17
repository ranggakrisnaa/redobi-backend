import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLecturerColumn1746851602695 implements MigrationInterface {
  name = 'ChangeLecturerColumn1746851602695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ALTER COLUMN "tipe_pembimbing" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ALTER COLUMN "tipe_pembimbing"
            SET NOT NULL
        `);
  }
}
