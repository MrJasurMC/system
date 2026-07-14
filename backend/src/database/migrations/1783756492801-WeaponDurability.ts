import { MigrationInterface, QueryRunner } from "typeorm";

export class WeaponDurability1783756492801 implements MigrationInterface {
    name = 'WeaponDurability1783756492801'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "items" ADD "maxDurability" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "remainingDurability" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "remainingDurability"`);
        await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "maxDurability"`);
    }
}
