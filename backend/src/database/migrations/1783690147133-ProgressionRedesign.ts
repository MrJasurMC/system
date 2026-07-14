import { MigrationInterface, QueryRunner } from "typeorm";

export class ProgressionRedesign1783690147133 implements MigrationInterface {
    name = 'ProgressionRedesign1783690147133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "bossDamageBonus"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "statBonuses"`);
        await queryRunner.query(`ALTER TABLE "world_bosses" DROP COLUMN "description"`);
        await queryRunner.query(`CREATE TYPE "public"."quests_rarity_enum" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "rarity" "public"."quests_rarity_enum" NOT NULL DEFAULT 'common'`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "icon" character varying`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "itemRewards" jsonb`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "requiredPreviousQuestId" uuid`);
        await queryRunner.query(`ALTER TABLE "quests" ADD "isChain" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "description" text`);
        await queryRunner.query(`CREATE TYPE "public"."workouts_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'elite')`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "difficulty" "public"."workouts_difficulty_enum" NOT NULL DEFAULT 'beginner'`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "muscles" jsonb`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "xpValue" integer NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "progressions" jsonb`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "safetyTips" text`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "howToUnlock" text`);
        await queryRunner.query(`CREATE TYPE "public"."achievements_rarity_enum" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "rarity" "public"."achievements_rarity_enum" NOT NULL DEFAULT 'common'`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "rewards" jsonb`);
        await queryRunner.query(`ALTER TABLE "world_bosses" ADD "lore" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "world_bosses" ADD "requirements" jsonb`);
        await queryRunner.query(`ALTER TABLE "world_bosses" ADD "rewards" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."quests_type_enum" RENAME TO "quests_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."quests_type_enum" AS ENUM('main_daily', 'side', 'recovery', 'challenge', 'punishment', 'weekly', 'monthly', 'story', 'hidden', 'legendary', 'boss_preparation', 'promotion_exam', 'seasonal', 'chain')`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" TYPE "public"."quests_type_enum" USING "type"::"text"::"public"."quests_type_enum"`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" SET DEFAULT 'main_daily'`);
        await queryRunner.query(`DROP TYPE "public"."quests_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."items_type_enum" RENAME TO "items_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."items_type_enum" AS ENUM('cosmetic', 'theme', 'border', 'title', 'profile_effect', 'xp_booster')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" TYPE "public"."items_type_enum" USING "type"::"text"::"public"."items_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."items_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."items_type_enum_old" AS ENUM('weapon', 'cosmetic', 'title', 'frame', 'consumable', 'relaxation', 'story', 'event', 'seasonal')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" TYPE "public"."items_type_enum_old" USING "type"::"text"::"public"."items_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."items_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."items_type_enum_old" RENAME TO "items_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."quests_type_enum_old" AS ENUM('main_daily', 'side', 'recovery', 'challenge', 'punishment', 'weekly', 'monthly', 'story', 'hidden', 'legendary', 'boss_preparation', 'promotion_exam', 'seasonal')`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" TYPE "public"."quests_type_enum_old" USING "type"::"text"::"public"."quests_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "quests" ALTER COLUMN "type" SET DEFAULT 'main_daily'`);
        await queryRunner.query(`DROP TYPE "public"."quests_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."quests_type_enum_old" RENAME TO "quests_type_enum"`);
        await queryRunner.query(`ALTER TABLE "world_bosses" DROP COLUMN "rewards"`);
        await queryRunner.query(`ALTER TABLE "world_bosses" DROP COLUMN "requirements"`);
        await queryRunner.query(`ALTER TABLE "world_bosses" DROP COLUMN "lore"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "rewards"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "rarity"`);
        await queryRunner.query(`DROP TYPE "public"."achievements_rarity_enum"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "howToUnlock"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "safetyTips"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "progressions"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "xpValue"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "muscles"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "difficulty"`);
        await queryRunner.query(`DROP TYPE "public"."workouts_difficulty_enum"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "isChain"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "requiredPreviousQuestId"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "itemRewards"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "icon"`);
        await queryRunner.query(`ALTER TABLE "quests" DROP COLUMN "rarity"`);
        await queryRunner.query(`DROP TYPE "public"."quests_rarity_enum"`);
        await queryRunner.query(`ALTER TABLE "world_bosses" ADD "description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "items" ADD "statBonuses" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "items" ADD "bossDamageBonus" integer NOT NULL DEFAULT '0'`);
    }

}
