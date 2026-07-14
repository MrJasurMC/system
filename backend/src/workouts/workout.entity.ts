import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WorkoutSession } from './workout-session.entity';

export enum WorkoutDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ELITE = 'elite',
}

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  HIIT = 'hiit',
}

/** workouts — §5. The exercise library (definitions). */
@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: WorkoutType, default: WorkoutType.STRENGTH })
  type: WorkoutType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: WorkoutDifficulty, default: WorkoutDifficulty.BEGINNER })
  difficulty: WorkoutDifficulty;

  @Column({ type: 'jsonb', nullable: true })
  muscles?: string[];

  @Column({ type: 'int', default: 10 })
  xpValue: number;

  @Column({ type: 'jsonb', nullable: true })
  progressions?: string[];

  @Column({ type: 'text', nullable: true })
  safetyTips?: string;

  @Column({ nullable: true })
  reps?: number;

  @Column({ type: 'float', nullable: true })
  weight?: number;

  /** Duration in seconds, for time-based exercises (plank, cardio). */
  @Column({ nullable: true })
  duration?: number;

  @OneToMany(() => WorkoutSession, (ws) => ws.workout)
  sessions: WorkoutSession[];
}
