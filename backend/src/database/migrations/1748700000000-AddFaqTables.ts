import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaqTables1748700000000 implements MigrationInterface {
  name = 'AddFaqTables1748700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suggested_faqs" (
        "id"           uuid              NOT NULL DEFAULT gen_random_uuid(),
        "shopId"       character varying NOT NULL,
        "questions"    jsonb             NOT NULL,
        "generatedAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suggested_faqs"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_suggested_faqs_shop" UNIQUE ("shopId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "faq_question_pool" (
        "id"        uuid              NOT NULL DEFAULT gen_random_uuid(),
        "shopId"    character varying NOT NULL,
        "question"  text              NOT NULL,
        "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_faq_question_pool" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_faq_question_pool_shop_created"
      ON "faq_question_pool" ("shopId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_faq_question_pool_shop_created"`);
    await queryRunner.query(`DROP TABLE "faq_question_pool"`);
    await queryRunner.query(`DROP TABLE "suggested_faqs"`);
  }
}
