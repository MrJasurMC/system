import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Character } from '@/characters/character.entity';
import { QuestProgress } from '@/quests/quest-progress.entity';
import { WorkoutSession } from '@/workouts/workout-session.entity';
import { InventoryItem } from '@/inventory/inventory-item.entity';
import { UserAchievement } from '@/achievements/user-achievement.entity';
import { Notification } from '@/notifications/notification.entity';

/**
 * users — player account. Authenticated with username + email + password.
 * On login/register the server issues an opaque session token that the
 * client stores locally and sends as `Authorization: Bearer <token>`; the
 * session stays valid for SESSION_TTL_DAYS (see AuthService) so returning
 * players aren't asked to log in again until it expires.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  username: string;

  @Index({ unique: true })
  @Column()
  email: string;

  /** bcrypt hash — never the raw password. */
  @Column()
  passwordHash: string;

  /** Current opaque session token, if logged in. Null once logged out or expired. */
  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  sessionToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sessionExpiresAt?: Date | null;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Character, (character) => character.user)
  character: Character;

  @OneToMany(() => QuestProgress, (qp) => qp.user)
  questProgress: QuestProgress[];

  @OneToMany(() => WorkoutSession, (ws) => ws.user)
  workoutSessions: WorkoutSession[];

  @OneToMany(() => InventoryItem, (ii) => ii.user)
  inventory: InventoryItem[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  achievements: UserAchievement[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];
}
