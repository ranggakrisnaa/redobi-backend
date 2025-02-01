import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1738140242176 implements MigrationInterface {
  name = 'CreateSessionsTable1738140242176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash_token" character varying(255) NOT NULL, "otp_code" integer NOT NULL, "otp_trial" integer NOT NULL, "is_limit" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_085d540d9f418cfbdc7bd55bb1" UNIQUE ("user_id"), CONSTRAINT "PK_session_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."lecturers_tipepembimbing_enum" RENAME TO "lecturers_tipepembimbing_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lecturers_tipe_pembimbing_enum" AS ENUM('Pembimbing 1', 'Pembimbing 2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lecturers" ALTER COLUMN "tipe_pembimbing" TYPE "public"."lecturers_tipe_pembimbing_enum" USING "tipe_pembimbing"::"text"::"public"."lecturers_tipe_pembimbing_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lecturers_tipepembimbing_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_session_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_session_users"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lecturers_tipepembimbing_enum_old" AS ENUM('Pembimbing 1', 'Pembimbing 2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lecturers" ALTER COLUMN "tipe_pembimbing" TYPE "public"."lecturers_tipepembimbing_enum_old" USING "tipe_pembimbing"::"text"::"public"."lecturers_tipepembimbing_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lecturers_tipe_pembimbing_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."lecturers_tipepembimbing_enum_old" RENAME TO "lecturers_tipepembimbing_enum"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
