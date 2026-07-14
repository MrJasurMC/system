import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

/** achievements — §5. The achievement catalog (definitions). */
@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable machine-readable slug (e.g. 'streak_7') used by services to look achievements up without hardcoding UUIDs. */
  @Column({ unique: true })
  key: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  howToUnlock?: string;

  @Column({ type: 'enum', enum: AchievementRarity, default: AchievementRarity.COMMON })
  rarity: AchievementRarity;

  /** Expected JSON structure: { "xp": 500, "gold": 100, "itemIds": [...] } */
  @Column({ type: 'jsonb', nullable: true })
  rewards?: Record<string, any>;

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  icon?: string;

  /** Hidden achievements aren't shown to the player until unlocked. */
  @Column({ default: false })
  hidden: boolean;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userEntries: UserAchievement[];
}
