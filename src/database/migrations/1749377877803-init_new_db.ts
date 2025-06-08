import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitNewDb1749377877803 implements MigrationInterface {
  name = 'InitNewDb1749377877803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ranking_matrices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lecturer_id" uuid NOT NULL, "final_score" numeric(5,2) NOT NULL, "rank" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ranking_Matrix_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ranking_normalized_matrices" ("id" SERIAL NOT NULL, "normalized_matrices_id" uuid NOT NULL, "ranking_matrices_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ranking_normalized_matrices_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "normalized_matrices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lecturer_id" uuid NOT NULL, "criteria_id" integer NOT NULL, "normalized_value" numeric(5,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_normalized_matrices_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."criteria_type_enum" AS ENUM('Benefit', 'Cost')`,
    );
    await queryRunner.query(
      `CREATE TABLE "criteria" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "weight" numeric(5,2) NOT NULL, "type" "public"."criteria_type_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_criteria_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sub_criteria" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "weight" numeric(5,2) NOT NULL, "criteria_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_sub_criteria_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assessment_sub_criteria" ("id" SERIAL NOT NULL, "sub_criteria_id" integer NOT NULL, "assessment_id" uuid NOT NULL, "score" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_assessment_sub_criteria_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lecturer_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_assessments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "selections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "lecturer_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_selections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."students_major_enum" AS ENUM('Sistem Cerdas', 'Rekayasa Perangkat Lunak', 'Multimedia')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."students_class_enum" AS ENUM('Reguler', 'Reguler Malam', 'Karyawan')`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(200) NOT NULL, "nim" character varying(200) NOT NULL, "tahun_masuk" integer NOT NULL, "major" "public"."students_major_enum" NOT NULL, "judul_skripsi" text NOT NULL, "abstract" text NOT NULL, "class" "public"."students_class_enum" NOT NULL, "image_url" text NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_students_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recommendations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "lecturer_id" uuid NOT NULL, "recommendation_score" numeric(5,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_recommendations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lecturers_tipe_pembimbing_enum" AS ENUM('Pembimbing 1', 'Pembimbing 2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lecturers_prodi_enum" AS ENUM('Teknik Informatika', 'Sistem Komputer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lecturers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(200) NOT NULL, "nidn" character varying(200) NOT NULL, "jumlah_bimbingan" integer NOT NULL, "tipe_pembimbing" "public"."lecturers_tipe_pembimbing_enum", "prodi" "public"."lecturers_prodi_enum" NOT NULL, "kuota_bimbingan" integer NOT NULL, "image_url" text NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_lecturers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "access_token" character varying(255) NOT NULL, "refresh_token" character varying(255) NOT NULL, "otp_code" integer NOT NULL, "otp_trial" integer NOT NULL, "valid_otp_until" TIMESTAMP WITH TIME ZONE, "is_limit" boolean NOT NULL DEFAULT false, "locked_until" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_085d540d9f418cfbdc7bd55bb1" UNIQUE ("user_id"), CONSTRAINT "PK_session_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(200) NOT NULL, "username" character varying(100) NOT NULL, "email" character varying(200) NOT NULL, "password" character varying(200) NOT NULL, "image_url" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_user_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_username" ON "users" ("username") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "keywords" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "thesis_keyword_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_keyword_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."thesis_keywords_category_enum" AS ENUM('Sistem Cerdas', 'Rekayasa Perangkat Lunak', 'Multimedia')`,
    );
    await queryRunner.query(
      `CREATE TABLE "thesis_keywords" ("id" SERIAL NOT NULL, "category" "public"."thesis_keywords_category_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_thesis_keyword_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_matrices" ADD CONSTRAINT "FK_ranking_matrix_lecturer" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices" FOREIGN KEY ("normalized_matrices_id") REFERENCES "normalized_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" ADD CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices" FOREIGN KEY ("ranking_matrices_id") REFERENCES "ranking_matrices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "normalized_matrices" ADD CONSTRAINT "FK_normalized_matrices_lecturer" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "normalized_matrices" ADD CONSTRAINT "FK_normalized_matrices_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" ADD CONSTRAINT "FK_criteria_sub_criteria" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" ADD CONSTRAINT "FK_assessment_sub_criteria_assessments" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD CONSTRAINT "FK_assessment_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" ADD CONSTRAINT "FK_selection_students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" ADD CONSTRAINT "FK_selection_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendation_students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendation_lecturers" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lecturers" ADD CONSTRAINT "FK_lecturer_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_session_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "keywords" ADD CONSTRAINT "FK_keyword_thesis_keywords" FOREIGN KEY ("thesis_keyword_id") REFERENCES "thesis_keywords"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "keywords" DROP CONSTRAINT "FK_keyword_thesis_keywords"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_session_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lecturers" DROP CONSTRAINT "FK_lecturer_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recommendations" DROP CONSTRAINT "FK_recommendation_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recommendations" DROP CONSTRAINT "FK_recommendation_students"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_students_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" DROP CONSTRAINT "FK_selection_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" DROP CONSTRAINT "FK_selection_students"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP CONSTRAINT "FK_assessment_lecturers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria_assessments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment_sub_criteria" DROP CONSTRAINT "FK_assessment_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_criteria" DROP CONSTRAINT "FK_criteria_sub_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "normalized_matrices" DROP CONSTRAINT "FK_normalized_matrices_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "normalized_matrices" DROP CONSTRAINT "FK_normalized_matrices_lecturer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_ranking_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_normalized_matrices" DROP CONSTRAINT "FK_ranking_normalized_matrices_normalized_matrices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ranking_matrices" DROP CONSTRAINT "FK_ranking_matrix_lecturer"`,
    );
    await queryRunner.query(`DROP TABLE "thesis_keywords"`);
    await queryRunner.query(
      `DROP TYPE "public"."thesis_keywords_category_enum"`,
    );
    await queryRunner.query(`DROP TABLE "keywords"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_user_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "lecturers"`);
    await queryRunner.query(`DROP TYPE "public"."lecturers_prodi_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."lecturers_tipe_pembimbing_enum"`,
    );
    await queryRunner.query(`DROP TABLE "recommendations"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TYPE "public"."students_class_enum"`);
    await queryRunner.query(`DROP TYPE "public"."students_major_enum"`);
    await queryRunner.query(`DROP TABLE "selections"`);
    await queryRunner.query(`DROP TABLE "assessments"`);
    await queryRunner.query(`DROP TABLE "assessment_sub_criteria"`);
    await queryRunner.query(`DROP TABLE "sub_criteria"`);
    await queryRunner.query(`DROP TABLE "criteria"`);
    await queryRunner.query(`DROP TYPE "public"."criteria_type_enum"`);
    await queryRunner.query(`DROP TABLE "normalized_matrices"`);
    await queryRunner.query(`DROP TABLE "ranking_normalized_matrices"`);
    await queryRunner.query(`DROP TABLE "ranking_matrices"`);
  }
}
