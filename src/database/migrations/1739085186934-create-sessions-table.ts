import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1739085186934 implements MigrationInterface {
  name = 'CreateSessionsTable1739085186934';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "hash_token" character varying(255) NOT NULL,
                "otp_code" integer NOT NULL,
                "otp_trial" integer NOT NULL,
                "is_limit" boolean NOT NULL DEFAULT false,
                "locked_until" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "REL_085d540d9f418cfbdc7bd55bb1" UNIQUE ("user_id"),
                CONSTRAINT "PK_session_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD CONSTRAINT "FK_session_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "sessions" DROP CONSTRAINT "FK_session_users"
        `);
    await queryRunner.query(`
            DROP TABLE "sessions"
        `);
  }
}
