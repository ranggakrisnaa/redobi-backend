import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAddProdiColumn1745071963870 implements MigrationInterface {
  name = 'AlterAddProdiColumn1745071963870';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."lecturers_prodi_enum" AS ENUM('Teknik Informatika', 'Sistem Komputer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lecturers" ADD "prodi" "public"."lecturers_prodi_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "access_token" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "access_token" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "lecturers" DROP COLUMN "prodi"`);
    await queryRunner.query(`DROP TYPE "public"."lecturers_prodi_enum"`);
  }
}
