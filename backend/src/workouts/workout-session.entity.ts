import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@/users/user.entity';
import { Workout } from './workout.entity';

/** workout_sessions — §5. A logged session of a workout by a user. */
@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.workoutSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  workoutId: string;

  @ManyToOne(() => Workout, (workout) => workout.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutId' })
  workout: Workout;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime?: Date;

  /** Freeform stats blob: { reps, sets, avgHeartRate, caloriesBurned, ... } */
  @Column({ type: 'jsonb', default: {} })
  stats: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
