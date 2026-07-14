import { MigrationInterface, QueryRunner } from "typeorm";

export class CharacterWeightKg1783990000000 implements MigrationInterface {
    name = 'CharacterWeightKg1783990000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "characters" ADD COLUMN "weightKg" double precision
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "weightKg"`);
    }
}
