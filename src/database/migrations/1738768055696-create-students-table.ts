import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentsTable1738768055696 implements MigrationInterface {
  name = 'CreateStudentsTable1738768055696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."students_major_enum" AS ENUM(
                'Sistem Cerdas',
                'Rekayasa Perangkat Lunak',
                'Multimedia'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."students_class_enum" AS ENUM('Regular', 'Regular Malam', 'Karyawan')
        `);
    await queryRunner.query(`
            CREATE TABLE "students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying(200) NOT NULL,
                "nim" character varying(200) NOT NULL,
                "tahun_masuk" integer NOT NULL,
                "major" "public"."students_major_enum" NOT NULL,
                "judul_skripsi" text NOT NULL,
                "abstract" text NOT NULL,
                "class" "public"."students_class_enum" NOT NULL,
                "image_url" character varying(200) NOT NULL,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_students_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "students"
            ADD CONSTRAINT "FK_students_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "students" DROP CONSTRAINT "FK_students_users"
        `);
    await queryRunner.query(`
            DROP TABLE "students"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."students_class_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."students_major_enum"
        `);
  }
}
