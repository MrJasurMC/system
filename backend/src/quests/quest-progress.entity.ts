import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '@/users/user.entity';
import { Quest } from './quest.entity';

export enum QuestStatus {
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  CLAIMED = 'claimed',
  FAILED = 'failed',
}

/** quest_progress — §5. Per-user progress against a quest definition. */
@Entity('quest_progress')
@Index(['userId', 'questId'], { unique: true })
export class QuestProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.questProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  questId: string;

  @ManyToOne(() => Quest, (quest) => quest.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questId' })
  quest: Quest;

  @Column({ type: 'enum', enum: QuestStatus, default: QuestStatus.ACCEPTED })
  status: QuestStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  /** §6 anti-cheat — set on each claim, checked against quest.cooldown before re-accepting a repeatable quest. */
  @Column({ type: 'timestamp', nullable: true })
  lastClaimedAt: Date | null;

  /** §6 anti-cheat — claims made today for a repeatable quest, checked against quest.dailyLimit. Resets on a new day. */
  @Column({ default: 0 })
  claimsToday: number;

  /** Date (no time) claimsToday was last incremented, used to reset it on a new day. */
  @Column({ type: 'date', nullable: true })
  lastClaimDate: string | null;

  /**
   * §6 requiresProof — set once verification is submitted for a
   * requiresProof quest (photo upload / tracker integration is a separate
   * feature; this column is just the gate claim() checks). Null until proof
   * lands, which is exactly what should block the claim.
   */
  @Column({ type: 'timestamp', nullable: true })
  proofSubmittedAt: Date | null;
}
