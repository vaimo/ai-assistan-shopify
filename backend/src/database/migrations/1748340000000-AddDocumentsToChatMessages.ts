import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentsToChatMessages1748340000000 implements MigrationInterface {
  name = 'AddDocumentsToChatMessages1748340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN IF NOT EXISTS "documents" jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      DROP COLUMN IF EXISTS "documents"
    `);
  }
}
