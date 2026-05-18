import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceIdToAuthTokens1778713200000 implements MigrationInterface {
  name = 'AddDeviceIdToAuthTokens1778713200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth_tokens"
      ADD COLUMN "device_id" varchar(128)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth_tokens"
      DROP COLUMN "device_id"
    `);
  }
}
