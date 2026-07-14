import { MigrationInterface, QueryRunner } from "typeorm";

export class CharacterLifetimeCounters1783783200000 implements MigrationInterface {
    name = 'CharacterLifetimeCounters1783783200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "characters" ADD "totalQuestsCompleted" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "characters" ADD "totalBossesDefeated" integer NOT NULL DEFAULT 0`);
        // Backfill from existing data so upgrading users don't show 0 despite real history.
        await queryRunner.query(`
            UPDATE "characters" c
            SET "totalQuestsCompleted" = sub.count
            FROM (
                SELECT "userId", COUNT(*) as count
                FROM "quest_progress"
                WHERE status = 'claimed'
                GROUP BY "userId"
            ) sub
            WHERE c."userId" = sub."userId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "totalBossesDefeated"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "totalQuestsCompleted"`);
    }
}
