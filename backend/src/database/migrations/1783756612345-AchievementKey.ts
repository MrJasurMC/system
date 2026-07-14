import { MigrationInterface, QueryRunner } from "typeorm";

export class AchievementKey1783756612345 implements MigrationInterface {
    name = 'AchievementKey1783756612345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" ADD "key" character varying`);
        // Existing rows (if any) get a unique placeholder so the UNIQUE
        // constraint below doesn't fail on a fresh-but-not-empty table —
        // in practice this table was unseeded until now, so this is a no-op
        // in the common case.
        await queryRunner.query(`UPDATE "achievements" SET "key" = 'legacy_' || "id" WHERE "key" IS NULL`);
        await queryRunner.query(`ALTER TABLE "achievements" ALTER COLUMN "key" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD CONSTRAINT "UQ_achievements_key" UNIQUE ("key")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" DROP CONSTRAINT "UQ_achievements_key"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "key"`);
    }
}
