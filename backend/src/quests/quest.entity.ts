import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { QuestProgress } from './quest-progress.entity';

export enum QuestType {
  MAIN_DAILY = 'main_daily',
  SIDE = 'side',
  RECOVERY = 'recovery',
  CHALLENGE = 'challenge',
  PUNISHMENT = 'punishment',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  STORY = 'story',
  HIDDEN = 'hidden',
  LEGENDARY = 'legendary',
  BOSS_PREPARATION = 'boss_preparation',
  PROMOTION_EXAM = 'promotion_exam',
  SEASONAL = 'seasonal',
  CHAIN = 'chain',
  VOICE_TRAINING = 'voice_training',
}

export enum QuestDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  ELITE = 'elite',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export enum QuestRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

/** quests — §5. The quest catalog (definitions), not per-user progress. */
@Entity('quests')
export class Quest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Used by removeOrphanedGeneratedQuests() to leave freshly-inserted quest
   * rows alone for a short grace window, so a concurrent request from
   * another user's generation cycle can't delete a quest that's still
   * mid-insert (quest row committed, its QuestProgress row not yet).
   */
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** Flavor/narrative text, separate from `description` (the actionable instruction). */
  @Column({ type: 'text', nullable: true })
  lore?: string;

  @Column({ type: 'enum', enum: QuestType, default: QuestType.MAIN_DAILY })
  type: QuestType;

  @Column({ type: 'enum', enum: QuestDifficulty, default: QuestDifficulty.NORMAL })
  difficulty: QuestDifficulty;

  @Column({ type: 'enum', enum: QuestRarity, default: QuestRarity.COMMON })
  rarity: QuestRarity;

  @Column({ nullable: true })
  icon?: string;

  /** e.g. "50 push-ups", stored as free text goal + numeric goalValue for progress math. */
  @Column()
  goal: string;

  @Column({ type: 'int', default: 1 })
  goalValue: number;

  @Column({ type: 'int', default: 0 })
  xpReward: number;

  @Column({ type: 'int', default: 0 })
  goldReward: number;

  @Column({ type: 'jsonb', nullable: true })
  attributeReward?: Record<string, number>;

  /** Expected JSON structure: { "itemIds": ["uuid1", "uuid2"] } */
  @Column({ type: 'jsonb', nullable: true })
  itemRewards?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  requiredPreviousQuestId?: string;

  @Column({ default: false })
  isChain: boolean;

  @Column({ type: 'int', nullable: true })
  estimatedTime?: number; // in minutes

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  active: boolean;

  // ─── §6 Anti-cheat ──────────────────────────────────────────────
  /** Hours that must pass after a claim before this quest can be accepted again. */
  @Column({ type: 'int', nullable: true })
  cooldown?: number;

  @Column({ default: false })
  repeatable: boolean;

  /** Max claims per day for a repeatable quest. Null = unlimited. */
  @Column({ type: 'int', nullable: true })
  dailyLimit?: number;

  /** Requires photo/metric proof before a claim is accepted (verification itself is a separate feature). */
  @Column({ default: false })
  requiresProof: boolean;

  // ─── §3 Hidden quests + quest trees ────────────────────────────
  @Column({ default: false })
  hidden: boolean;

  /** e.g. { type: 'streak', value: 30 }. Evaluated server-side — never trust the client to know a hidden quest exists. */
  @Column({ type: 'jsonb', nullable: true })
  revealCondition?: Record<string, any>;

  /** Groups quests into a branching tree (e.g. "toji_back_path", "programmer_backend"). */
  @Column({ type: 'varchar', nullable: true })
  treeId?: string;

  @Column({ type: 'int', nullable: true })
  treeOrder?: number;

  // ─── §8 Punishments ─────────────────────────────────────────────
  /** Applied on expiry for time-boxed/PUNISHMENT quests. e.g. { focusPercent: -5, energyPercent: -10, breakStreak: true } */
  @Column({ type: 'jsonb', nullable: true })
  failurePenalty?: Record<string, any>;

  @OneToMany(() => QuestProgress, (qp) => qp.quest)
  progress: QuestProgress[];
}
