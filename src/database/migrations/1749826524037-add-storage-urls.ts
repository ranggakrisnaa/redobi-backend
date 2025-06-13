import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageUrls1749826524037 implements MigrationInterface {
  name = 'AddStorageUrls1749826524037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."storage_urls_file_type_enum" AS ENUM('PDF', 'Excel')
        `);
    await queryRunner.query(`
            CREATE TABLE "storage_urls" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "file_type" "public"."storage_urls_file_type_enum" NOT NULL,
                "file_url" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_storage_urls_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "storage_urls"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."storage_urls_file_type_enum"
        `);
  }
}
