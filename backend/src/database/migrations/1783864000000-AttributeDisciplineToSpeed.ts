import { MigrationInterface, QueryRunner } from "typeorm";

/** Renames attributes.discipline -> attributes.speed. Uses ALTER TABLE ...
 *  RENAME COLUMN so every existing character keeps their allocated points —
 *  nobody's stat total changes, only the label. */
export class AttributeDisciplineToSpeed1783864000000 implements MigrationInterface {
    name = 'AttributeDisciplineToSpeed1783864000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributes" RENAME COLUMN "discipline" TO "speed"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributes" RENAME COLUMN "speed" TO "discipline"`);
    }
}
