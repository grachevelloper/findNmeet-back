import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavoritesTable1778457600000 implements MigrationInterface {
  name = 'CreateFavoritesTable1778457600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" integer NOT NULL,
        "external_id" varchar(128) NOT NULL,
        "display_title" varchar(255) NOT NULL,
        "display_image_url" text NOT NULL DEFAULT '',
        "note" text NOT NULL DEFAULT '',
        "added_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        "vk_snapshot" jsonb,
        CONSTRAINT "PK_favorites_id" PRIMARY KEY ("id"),
        CONSTRAINT "favorites_user_provider_external_unique" UNIQUE ("user_id", "provider", "external_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "favorites_owner_added_at_idx" ON "favorites" ("user_id", "added_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "favorites_owner_added_at_idx"');
    await queryRunner.query('DROP TABLE "favorites"');
  }
}
