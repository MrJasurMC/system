import { MigrationInterface, QueryRunner } from "typeorm";

export class WorldBossTier1783860000000 implements MigrationInterface {
    name = 'WorldBossTier1783860000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "world_bosses" ADD "tier" character varying NOT NULL DEFAULT 'common'`);
        // Backfill existing rows by week number so history isn't lost — mirrors
        // the tier progression curve used going forward (see boss-catalog.ts).
        await queryRunner.query(`
            UPDATE "world_bosses" SET "tier" = CASE
                WHEN "weekNumber" % 10 = 0 THEN 'immortal'
                WHEN "weekNumber" % 5 = 0 THEN 'mythic'
                WHEN "weekNumber" % 3 = 0 THEN 'legendary'
                WHEN "weekNumber" % 2 = 0 THEN 'elite'
                ELSE 'common'
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "world_bosses" DROP COLUMN "tier"`);
    }
}
