import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The Character entity has always declared `nextVoiceQuestAt` (mirroring
 * nextMainQuestAt / nextSideQuestAt for the Voice Training quest), but the
 * original InitialSchema migration's CREATE TABLE for "characters" never
 * included it. On any DB built from that migration, every query touching
 * the characters table (i.e. every GET /api/characters call) fails with
 * "column characters.nextVoiceQuestAt does not exist" (Postgres 42703),
 * which is what caused the Status page to 500 on every load.
 *
 * InitialSchema itself has been corrected so a *fresh* database gets the
 * column from the start, but TypeORM won't re-run a migration that's
 * already recorded as applied — so any DB that ran the old version needs
 * this additive follow-up to actually get the column.
 */
export class AddCharacterNextVoiceQuestAt1784600000000 implements MigrationInterface {
  name = 'AddCharacterNextVoiceQuestAt1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "characters"
      ADD COLUMN IF NOT EXISTS "nextVoiceQuestAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN IF EXISTS "nextVoiceQuestAt"`);
  }
}
