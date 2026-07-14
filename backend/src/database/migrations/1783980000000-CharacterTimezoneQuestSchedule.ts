import { MigrationInterface, QueryRunner } from "typeorm";

export class CharacterTimezoneQuestSchedule1783980000000 implements MigrationInterface {
    name = 'CharacterTimezoneQuestSchedule1783980000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "characters" ADD COLUMN "timezone" character varying NOT NULL DEFAULT 'Asia/Tashkent'
        `);
        await queryRunner.query(`
            ALTER TABLE "characters" ADD COLUMN "nextMainQuestAt" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "characters" ADD COLUMN "nextSideQuestAt" TIMESTAMP
        `);

        // Deactivate the old Project Toji seeded catalog (pillar chains + story
        // quests from seed_toji_quests.ts) and the old "Daily Discipline" habit
        // quest — the app now only ever shows MAIN_DAILY and SIDE quests.
        await queryRunner.query(`
            UPDATE "quests" SET "active" = false
            WHERE "type" IN ('story', 'chain') OR "title" = 'Daily Discipline'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "nextSideQuestAt"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "nextMainQuestAt"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "timezone"`);
    }
}
