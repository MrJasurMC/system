import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The original InitialSchema migration's CREATE TABLE for "quests" never
 * included "createdAt", even though the Quest entity has always declared
 * @CreateDateColumn() createdAt — and quest-generator.service.ts /
 * quests.service.ts both rely on it (grace-window checks in
 * removeOrphanedGeneratedQuests, ordering in dedupeActiveQuests). On any DB
 * built from that migration, every quest query touching createdAt fails
 * with "column Quest.createdAt does not exist" (Postgres 42703) — which is
 * exactly what caused /api/quests and /api/quests/mine to 500 on every
 * single request.
 *
 * InitialSchema itself has been corrected so a *fresh* database gets the
 * column from the start, but TypeORM tracks migrations by name/timestamp and
 * won't re-run one that's already recorded as applied — so any DB that ran
 * the old version needs this additive follow-up to actually get the column.
 */
export class AddQuestCreatedAt1784247600000 implements MigrationInterface {
  name = 'AddQuestCreatedAt1784247600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quests"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN IF EXISTS "createdAt"`);
  }
}
