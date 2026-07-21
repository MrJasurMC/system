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
    await queryRunner.query(`
      ALTER TABLE "quest_prerequisites"
      ADD CONSTRAINT "FK_quest_prerequisites_questId"
      FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "quest_prerequisites"
      ADD CONSTRAINT "FK_quest_prerequisites_requiredQuestId"
      FOREIGN KEY ("requiredQuestId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quest_prerequisites"`);
  }
}
