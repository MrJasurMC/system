import { MigrationInterface, QueryRunner } from "typeorm";

export class CharacterAgeYears1784000000000 implements MigrationInterface {
    name = 'CharacterAgeYears1784000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "characters" ADD COLUMN "ageYears" integer
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "ageYears"`);
    }
}
