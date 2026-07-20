import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { rankForLevel, titleForLevel } from './leveling';
import { User } from '@/users/user.entity';
import { Attributes } from './attributes.entity';
import { Skill } from './skill.entity';

export enum CharacterClass {
  WARRIOR = 'warrior',
  RANGER = 'ranger',
  MAGE = 'mage',
  MONK = 'monk',
  ASSASSIN = 'assassin',
  BERSERKER = 'berserker',
  CLERIC = 'cleric',
  PALADIN = 'paladin',
  ROGUE = 'rogue',
  WIZARD = 'wizard',
  SAMURAI = 'samurai',
  LUCKY = 'lucky',
}

/** characters — §5. One character per user (extend to array later for multi-character support). */
@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CharacterClass, default: CharacterClass.WARRIOR })
  class: CharacterClass;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  exp: number;

  /** Total EXP required to reach the next level — kept server-side, never trusted from client. */
  @Column({ default: 1000 })
  expToNextLevel: number;

  get rank(): string {
    return rankForLevel(this.level);
  }

  /** Narrative title (Project Limitless ladder), independent of raid-facing `rank`. */
  get title(): string {
    return titleForLevel(this.level);
  }

  /**
   * TypeORM entity getters (like `rank` above) live on the prototype, not as
   * own enumerable properties — Express's res.json() -> JSON.stringify only
   * serializes own properties, so `rank` was silently dropped from every API
   * response even though the getter worked fine when accessed in code. This
   * is why the frontend rendered "LV.16 |  | WARRIOR" with an empty rank slot.
   */
  toJSON() {
    return { ...this, rank: this.rank, title: this.title };
  }

  @Column({ default: 100 })
  hp: number;

  @Column({ default: 100 })
  maxHp: number;

  @Column({ default: 50 })
  mp: number;

  @Column({ default: 50 })
  maxMp: number;

  @Column({ default: 0 })
  gold: number;

  @Column({ default: 0 })
  disciplineScore: number;

  /** Consecutive days with a claimed MAIN_DAILY quest. */
  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  /** Date (no time) the streak was last advanced, used to detect same-day vs next-day claims. */
  @Column({ type: 'date', nullable: true })
  lastStreakDate: string | null;

  /** Consecutive quests claimed today, back-to-back — powers the combo/momentum UI. Resets on a new day. */
  @Column({ default: 0 })
  dailyMissionCombo: number;

  /** Highest combo ever reached in a single day, for "Perfect Day" style callouts. */
  @Column({ default: 0 })
  bestDailyMissionCombo: number;

  /** Date (no time) dailyMissionCombo was last incremented, used to reset the combo on a new day. */
  @Column({ type: 'date', nullable: true })
  lastMissionComboDate: string | null;

  /** IANA timezone (e.g. "Asia/Tashkent", "Europe/Moscow") — quests reset at 5:00 AM in this zone. */
  @Column({ default: 'Asia/Tashkent' })
  timezone: string;

  /** Set on claim to the next local 5:00 AM. The Main quest won't regenerate before this instant. */
  @Column({ type: 'timestamp', nullable: true })
  nextMainQuestAt: Date | null;

  /** Same idea as nextMainQuestAt, but for the Side quest. */
  @Column({ type: 'timestamp', nullable: true })
  nextSideQuestAt: Date | null;

  /** Same idea as nextMainQuestAt, but for the Voice Training quest. */
  @Column({ type: 'timestamp', nullable: true })
  nextVoiceQuestAt: Date | null;

  /** Bodyweight in kg — drives the Side quest's daily water/calorie targets. Set via Nutrition. */
  @Column({ type: 'float', nullable: true })
  weightKg: number | null;

  /** Age in years — drives the Side quest's daily water/calorie targets. Set via Nutrition. */
  @Column({ type: 'int', nullable: true })
  ageYears: number | null;

  /**
   * Lifetime counters, incremented exactly once at the source of truth
   * (QuestsService.claim, BossesService.submitDamage kill branch). Kept as
   * real columns rather than derived from a COUNT query or pieced together
   * from achievement progress (which freezes once a tier unlocks and is the
   * wrong source for an ever-growing total). This is what the Dashboard's
   * "Quests Completed" / "Bosses Defeated" quick stats read.
   */
  @Column({ default: 0 })
  totalQuestsCompleted: number;

  @Column({ default: 0 })
  totalBossesDefeated: number;

  /**
   * §4 Energy system — 0-100, decays daily (see CharactersService cron),
   * restored by RECOVERY-type quests and sleep logging. QuestGeneratorService
   * reads these to bias generated quest difficulty: low energy -> easier
   * quests, high energy -> unlocks HARD/ELITE/MYTHIC rolls.
   */
  @Column({ default: 100 })
  mentalEnergy: number;

  @Column({ default: 100 })
  physicalEnergy: number;

  @Column({ type: 'date', nullable: true })
  lastEnergyDecayDate: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Attributes, (attrs) => attrs.character, { cascade: true })
  attributes: Attributes;

  @OneToMany(() => Skill, (skill) => skill.character)
  skills: Skill[];
}
