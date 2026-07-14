/**
 * ONE-OFF SCRIPT — run this exactly once against a brand new, empty
 * production database (e.g. a fresh Supabase project) that has never had
 * migrations run against it before.
 *
 * Why this exists: this project's migration history only captures changes
 * on top of a baseline schema that was originally created by
 * `synchronize: true` during early local development — that baseline was
 * never itself captured as a migration. Running `migration:run` against a
 * truly empty database fails immediately, because migration #1 tries to
 * ALTER tables that were assumed to already exist.
 *
 * This script sidesteps that gap for a one-time production bootstrap:
 *   1. Creates the full schema from the CURRENT entity definitions
 *      (equivalent to what all 12 migrations combined should produce).
 *   2. Marks all 12 existing migrations as already-applied in the
 *      `migrations` table, so `migration:run` won't try to re-run their
 *      (now-inapplicable) incremental diffs against this database.
 *
 * After this runs successfully, treat this database exactly like any
 * other — future `npm run migration:generate` / `migration:run` work
 * normally from here on. Do NOT run this script a second time against a
 * database that already has tables in it.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/database/bootstrap-fresh-db.ts
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entities } from '@/config/typeorm.cli';

const EXISTING_MIGRATIONS: Array<{ timestamp: number; name: string }> = [
  { timestamp: 1783690147133, name: 'ProgressionRedesign1783690147133' },
  { timestamp: 1783694354425, name: 'RealLifeShopRedesign1783694354425' },
  { timestamp: 1783756492801, name: 'WeaponDurability1783756492801' },
  { timestamp: 1783756612345, name: 'AchievementKey1783756612345' },
  { timestamp: 1783783200000, name: 'CharacterLifetimeCounters1783783200000' },
  { timestamp: 1783860000000, name: 'WorldBossTier1783860000000' },
  { timestamp: 1783864000000, name: 'AttributeDisciplineToSpeed1783864000000' },
  { timestamp: 1783960000000, name: 'QuestRework1783960000000' },
  { timestamp: 1783970000000, name: 'QuestMultiPrerequisites1783970000000' },
  { timestamp: 1783980000000, name: 'CharacterTimezoneQuestSchedule1783980000000' },
  { timestamp: 1783990000000, name: 'CharacterWeightKg1783990000000' },
  { timestamp: 1784000000000, name: 'CharacterAgeYears1784000000000' },
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'limitless',
    password: process.env.DB_PASSWORD ?? 'change_me',
    database: process.env.DB_NAME ?? 'project_limitless',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities,
    synchronize: false, // we call synchronize() manually below, once, deliberately
    logging: true,
  });

  await dataSource.initialize();
  console.log('Connected. Checking for existing tables...');

  const existingTables: Array<{ table_name: string }> = await dataSource.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
  );
  const realTables = existingTables.filter((t) => t.table_name !== 'migrations');
  if (realTables.length > 0) {
    console.error(
      `Refusing to run: found ${realTables.length} existing table(s) (${realTables
        .map((t) => t.table_name)
        .join(', ')}). This script is only for a completely empty database. Aborting — no changes made.`,
    );
    await dataSource.destroy();
    process.exit(1);
  }

  console.log('Database is empty. Creating schema from current entities...');
  await dataSource.synchronize();
  console.log('Schema created.');

  console.log('Marking existing migrations as already-applied...');
  await dataSource.query(
    `CREATE TABLE IF NOT EXISTS "migrations" ("id" SERIAL NOT NULL, "timestamp" bigint NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id"))`,
  );
  for (const migration of EXISTING_MIGRATIONS) {
    await dataSource.query(`INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`, [
      migration.timestamp,
      migration.name,
    ]);
  }
  console.log(`Marked ${EXISTING_MIGRATIONS.length} migrations as applied.`);

  await dataSource.destroy();
  console.log('Done. This database is now ready for normal use.');
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
