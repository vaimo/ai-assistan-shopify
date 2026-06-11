import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeLokteSessionIdNullable1749556000000 implements MigrationInterface {
  name = 'MakeLokteSessionIdNullable1749556000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Allow lokteSessionId to be NULL so sessions can be created before
    // the first message is sent (lazy Lokte session initialisation).
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ALTER COLUMN "lokteSessionId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fill any nulls with a placeholder before restoring the NOT NULL constraint
    await queryRunner.query(`
      UPDATE "chat_sessions" SET "lokteSessionId" = '' WHERE "lokteSessionId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ALTER COLUMN "lokteSessionId" SET NOT NULL
    `);
  }
}
