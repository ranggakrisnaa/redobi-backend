import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLecturersTable1738768169349 implements MigrationInterface {
  name = 'CreateLecturersTable1738768169349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."lecturers_tipe_pembimbing_enum" AS ENUM('Pembimbing 1', 'Pembimbing 2')
        `);
    await queryRunner.query(`
            CREATE TABLE "lecturers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying(200) NOT NULL,
                "jumlah_bimbingan" integer NOT NULL,
                "tipe_pembimbing" "public"."lecturers_tipe_pembimbing_enum" NOT NULL,
                "image_url" text NOT NULL,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_lecturers_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD CONSTRAINT "FK_lecturer_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP CONSTRAINT "FK_lecturer_users"
        `);
    await queryRunner.query(`
            DROP TABLE "lecturers"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."lecturers_tipe_pembimbing_enum"
        `);
  }
}
