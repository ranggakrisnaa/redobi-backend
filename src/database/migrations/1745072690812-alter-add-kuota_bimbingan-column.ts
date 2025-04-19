import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAddKuotaBimbinganColumn1745072690812
  implements MigrationInterface
{
  name = 'AlterAddKuotaBimbinganColumn1745072690812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lecturers" ADD "kuota_bimbingan" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lecturers" DROP COLUMN "kuota_bimbingan"`,
    );
  }
}
