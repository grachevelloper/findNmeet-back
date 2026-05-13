import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1778544000000 implements MigrationInterface {
  name = 'CreateAuthTables1778544000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        "last_active_at" timestamptz NOT NULL,
        "status" integer NOT NULL,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "user_external_links" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" integer NOT NULL,
        "external_id" varchar(128) NOT NULL,
        "provider_meta" jsonb,
        "linked_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "PK_user_external_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "user_external_links_provider_external_unique" UNIQUE ("provider", "external_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "user_external_links_user_idx" ON "user_external_links" ("user_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_tokens" (
        "id" uuid NOT NULL,
        "external_link_id" uuid NOT NULL,
        "access_token_ciphertext" text NOT NULL,
        "refresh_token_ciphertext" text NOT NULL DEFAULT '',
        "encryption_key_id" varchar(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        "last_used_at" timestamptz,
        "revoked_at" timestamptz,
        CONSTRAINT "PK_auth_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "auth_tokens_external_link_unique" UNIQUE ("external_link_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "refresh_token_hash" varchar(128) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "auth_sessions_refresh_hash_idx" ON "auth_sessions" ("refresh_token_hash")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "auth_sessions_refresh_hash_idx"');
    await queryRunner.query('DROP INDEX "auth_sessions_user_idx"');
    await queryRunner.query('DROP TABLE "auth_sessions"');
    await queryRunner.query('DROP TABLE "auth_tokens"');
    await queryRunner.query('DROP INDEX "user_external_links_user_idx"');
    await queryRunner.query('DROP TABLE "user_external_links"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
