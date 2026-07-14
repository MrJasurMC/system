import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestRework1783960000000 implements MigrationInterface {
    name = 'QuestRework1783960000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // §1 — new non-physical attribute stats
        await queryRunner.query(`ALTER TABLE "attributes" ADD "discipline" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "attributes" ADD "focus" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "attributes" ADD "programming" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "attributes" ADD "knowledge" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "attributes" ADD "charisma" integer NOT NULL DEFAULT 10`);
        await queryRunner.query(`ALTER TABLE "attributes" ADD "finance" integer NOT NULL DEFAULT 10`);

        // §4 — character energy system
        await queryRunner.query(`ALTER TABLE "characters" ADD "mentalEnergy" integer NOT NULL DEFAULT 100`);
        await queryRunner.query(`ALTER TABLE "characters" ADD "physicalEnergy" integer NOT NULL DEFAULT 100`);
        await queryRunner.query(`ALTER TABLE "characters" ADD "lastEnergyDecayDate" date`);

        // §3 / §6 / §7 / §8 — quest fields
        await queryRunner.query(`ALTER TABLE "quests" ADD "lore" text`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "cooldown" integer`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "repeatable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "dailyLimit" integer`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "requiresProof" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "hidden" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "revealCondition" jsonb`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "treeId" character varying`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "treeOrder" integer`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "failurePenalty" jsonb`);

        // §6 — quest_progress anti-cheat tracking
        await queryRunner.query(`ALTER TABLE "quest_progress" ADD "lastClaimedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "quest_progress" ADD "claimsToday" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "quest_progress" ADD "lastClaimDate" date`);
        await queryRunner.query(`ALTER TABLE "quest_progress" ADD "proofSubmittedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quest_progress" DROP COLUMN "proofSubmittedAt"`);
        await queryRunner.query(`ALTER TABLE "quest_progress" DROP COLUMN "lastClaimDate"`);
        await queryRunner.query(`ALTER TABLE "quest_progress" DROP COLUMN "claimsToday"`);
        await queryRunner.query(`ALTER TABLE "quest_progress" DROP COLUMN "lastClaimedAt"`);

        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "failurePenalty"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "treeOrder"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "treeId"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "revealCondition"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "hidden"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "requiresProof"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "dailyLimit"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "repeatable"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "cooldown"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "lore"`);

        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "lastEnergyDecayDate"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "physicalEnergy"`);
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "mentalEnergy"`);

        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "finance"`);
        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "charisma"`);
        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "knowledge"`);
        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "programming"`);
        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "focus"`);
        await queryRunner.query(`ALTER TABLE "attributes" DROP COLUMN "discipline"`);
    }
}
