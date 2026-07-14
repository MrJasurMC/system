import { MigrationInterface, QueryRunner } from "typeorm";

export class RealLifeShopRedesign1783694354425 implements MigrationInterface {
    name = 'RealLifeShopRedesign1783694354425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "items" ADD "unlockRequirements" jsonb`);
        await queryRunner.query(`ALTER TABLE "items" ADD "weekRotation" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TYPE "public"."items_type_enum" RENAME TO "items_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."items_type_enum" AS ENUM('reward', 'cosmetic')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" TYPE "public"."items_type_enum" USING "type"::"text"::"public"."items_type_enum"`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" SET DEFAULT 'reward'`);
        await queryRunner.query(`DROP TYPE "public"."items_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" SET DEFAULT 'reward'`);
        await queryRunner.query(`ALTER TYPE "public"."items_category_enum" RENAME TO "items_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."items_category_enum" AS ENUM('entertainment', 'food', 'recovery', 'lifestyle', 'premium')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" TYPE "public"."items_category_enum" USING "category"::"text"::"public"."items_category_enum"`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" SET DEFAULT 'lifestyle'`);
        await queryRunner.query(`DROP TYPE "public"."items_category_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."items_category_enum_old" AS ENUM('combat', 'appearance', 'lifestyle', 'story', 'limited')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" TYPE "public"."items_category_enum_old" USING "category"::"text"::"public"."items_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "category" SET DEFAULT 'appearance'`);
        await queryRunner.query(`DROP TYPE "public"."items_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."items_category_enum_old" RENAME TO "items_category_enum"`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."items_type_enum_old" AS ENUM('cosmetic', 'theme', 'border', 'title', 'profile_effect', 'xp_booster')`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "type" TYPE "public"."items_type_enum_old" USING "type"::"text"::"public"."items_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."items_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."items_type_enum_old" RENAME TO "items_type_enum"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "weekRotation"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "unlockRequirements"`);
    }

}
