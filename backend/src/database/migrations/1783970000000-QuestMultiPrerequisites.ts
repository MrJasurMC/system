import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestMultiPrerequisites1783970000000 implements MigrationInterface {
    name = 'QuestMultiPrerequisites1783970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "quest_prerequisites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "questId" uuid NOT NULL,
                "requiredQuestId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quest_prerequisites" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_quest_prerequisites_pair" ON "quest_prerequisites" ("questId", "requiredQuestId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_quest_prerequisites_questId" ON "quest_prerequisites" ("questId")
        `);
        await queryRunner.query(`
            ALTER TABLE "quest_prerequisites"
            ADD CONSTRAINT "FK_quest_prerequisites_quest" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "quest_prerequisites"
            ADD CONSTRAINT "FK_quest_prerequisites_required" FOREIGN KEY ("requiredQuestId") REFERENCES "quests"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "quest_prerequisites"`);
    }
}
