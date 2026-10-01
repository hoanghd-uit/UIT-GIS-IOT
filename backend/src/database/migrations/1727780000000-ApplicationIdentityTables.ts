import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplicationIdentityTables1727780000000 implements MigrationInterface {
  name = 'ApplicationIdentityTables1727780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create application_users table
    await queryRunner.query(`
      CREATE TABLE "application_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "username" varchar(64) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(32) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_application_users_username" UNIQUE ("username"),
        CONSTRAINT "CHK_application_users_role" CHECK ("role" IN ('viewer', 'manager'))
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_application_users_username" ON "application_users" ("username");
    `);

    // 2. Create application_sessions table
    await queryRunner.query(`
      CREATE TABLE "application_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz NULL,
        CONSTRAINT "UQ_application_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_application_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "application_users" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_user_id" ON "application_sessions" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_expires_at" ON "application_sessions" ("expires_at");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_sessions_token_hash" ON "application_sessions" ("token_hash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "application_sessions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "application_users";`);
  }
}
