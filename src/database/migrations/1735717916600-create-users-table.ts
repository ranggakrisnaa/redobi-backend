import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1735717916600 implements MigrationInterface {
  name = 'CreateUsersTable1735717916600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(200) NOT NULL, "username" character varying(100) NOT NULL, "email" character varying(200) NOT NULL, "password" character varying(200) NOT NULL, "image_url" character varying(200) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_user_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_username" ON "users" ("username") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_email" ON "users" ("email") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_user_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
