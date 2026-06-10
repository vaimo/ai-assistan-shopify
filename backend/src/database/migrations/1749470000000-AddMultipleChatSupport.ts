import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultipleChatSupport1749470000000 implements MigrationInterface {
  name = 'AddMultipleChatSupport1749470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add title column to chat_sessions
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD COLUMN IF NOT EXISTS "title" character varying(80) NOT NULL DEFAULT ''
    `);

    // 2. Add chatSessionId (nullable first, filled by backfill, then made NOT NULL)
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN IF NOT EXISTS "chatSessionId" uuid NULL
    `);

    // 3. Backfill chatSessionId: link each message row to the matching session via (shopId, userId)
    await queryRunner.query(`
      UPDATE "chat_messages" cm
      SET    "chatSessionId" = cs."id"
      FROM   "chat_sessions" cs
      WHERE  cm."shopId"  = cs."shopId"
        AND  cm."userId"  = cs."userId"
        AND  cm."chatSessionId" IS NULL
    `);

    // 4. Remove any orphaned messages that have no matching session (defensive)
    await queryRunner.query(`
      DELETE FROM "chat_messages" WHERE "chatSessionId" IS NULL
    `);

    // 5. Now make chatSessionId NOT NULL with a FK (ON DELETE CASCADE)
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ALTER COLUMN "chatSessionId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD CONSTRAINT "FK_chat_messages_session"
      FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE
    `);

    // 6. Index on chatSessionId for fast history lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_messages_session_id"
      ON "chat_messages" ("chatSessionId")
    `);

    // 7. Drop the unique constraint that prevented multiple sessions per user
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "UQ_chat_sessions_shop_user"
    `);

    // 8. Add index for fast listing of sessions per user
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_sessions_shop_user"
      ON "chat_sessions" ("shopId", "userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_sessions_shop_user"`);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD CONSTRAINT "UQ_chat_sessions_shop_user" UNIQUE ("shopId", "userId")
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_messages_session_id"`);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      DROP CONSTRAINT IF EXISTS "FK_chat_messages_session"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      DROP COLUMN IF EXISTS "chatSessionId"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP COLUMN IF EXISTS "title"
    `);
  }
}
