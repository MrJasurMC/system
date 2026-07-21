import 'dotenv/config';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '@/users/user.entity';
import { Character } from '@/characters/character.entity';
import { Attributes } from '@/characters/attributes.entity';
import { Skill } from '@/characters/skill.entity';
import { Quest } from '@/quests/quest.entity';
import { QuestProgress } from '@/quests/quest-progress.entity';
import { Workout } from '@/workouts/workout.entity';
import { WorkoutSession } from '@/workouts/workout-session.entity';
import { Item } from '@/inventory/item.entity';
import { InventoryItem } from '@/inventory/inventory-item.entity';
import { Achievement } from '@/achievements/achievement.entity';
import { UserAchievement } from '@/achievements/user-achievement.entity';
import { Notification } from '@/notifications/notification.entity';
import { WorldBoss } from '@/bosses/world-boss.entity';
import { BossDamage } from '@/bosses/boss-damage.entity';
import { ChronicleEntry } from '@/chronicles/chronicle-entry.entity';

export const entities = [
  User,
  Character,
  Attributes,
  Skill,
  Quest,
  QuestProgress,
  Workout,
  WorkoutSession,
  Item,
  InventoryItem,
  Achievement,
  UserAchievement,
  Notification,
  WorldBoss,
  BossDamage,
  ChronicleEntry,
];

export const typeOrmDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'limitless',
  password: process.env.DB_PASSWORD ?? 'change_me',
  database: process.env.DB_NAME ?? 'project_limitless',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities,
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

/** Used by the TypeORM CLI (`npm run migration:generate` / `migration:run`). */
export default new DataSource(typeOrmDataSourceOptions);
