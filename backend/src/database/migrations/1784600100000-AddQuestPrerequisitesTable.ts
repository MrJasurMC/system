import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The QuestPrerequisite entity (quest_prerequisites — §3 multi-parent quest
 * trees) has existed since the quest rework, and QuestsService.accept() has
 * always queried it via unmetPrerequisites() on every fresh quest accept.
 * But no migration ever created the table — InitialSchema's table list
 * jumps straight from "quests"/"quest_progress" to "workouts" and never
 * includes it. On any DB built from the existing migrations, POST
 * /api/quests/:id/accept 500s with "relation quest_prerequisites does not
 * exist" (Postgres 42P01) for every quest that has never been attempted
 * before, since that's exactly when unmetPrerequisites() runs.
 *
 * NOTE: an earlier version of this migration also added FK constraints on
 * questId/requiredQuestId -> quests(id). On the actual production DB those
 * failed at boot with "foreign key constraint ... cannot be implemented"
 * (Postgres 42804) and put the app in an infinite migration-retry crash
 * loop, blocking every deploy entirely. QuestPrerequisite has no
 * @ManyToOne/@JoinColumn on the entity — it's referenced at the app level
 * only (plain @Column uuids), so a physical FK was never actually required
 * for the app to work. Table + indexes are sufficient; FKs dropped so this
 * can't wedge the boot sequence again regardless of whatever schema-level
 * mismatch caused it.
 */
export class AddQuestPrerequisitesTable1784600100000 implements MigrationInterface {
  name = 'AddQuestPrerequisitesTable1784600100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quest_prerequisites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "questId" uuid NOT NULL,
        "requiredQuestId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quest_prerequisites_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_quest_prerequisites_questId"
      ON "quest_prerequisites" ("questId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_quest_prerequisites_questId_requiredQuestId"
      ON "quest_prerequisites" ("questId", "requiredQuestId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quest_prerequisites"`);
  }
}
