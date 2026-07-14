import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './workout.entity';
import { WorkoutSession } from './workout-session.entity';
import { EventsGateway } from '@/realtime/events.gateway';
import { CharactersService } from '@/characters/characters.service';

/**
 * Deterministic, server-authoritative XP calc. This is the ONLY source of
 * truth for XP — client-provided xpEarned is never trusted (audit Fix #1).
 * Reps/sets are clamped to sane bounds so malformed or spoofed `stats`
 * can't be used to back into an arbitrarily large XP grant.
 */
function estimateXp(stats: Record<string, unknown>): number {
  const rawReps = typeof stats.reps === 'number' ? stats.reps : 0;
  const rawSets = typeof stats.sets === 'number' ? stats.sets : 1;

  const reps = Math.max(0, Math.min(rawReps, 1000));
  const sets = Math.max(1, Math.min(rawSets, 20));

  return Math.max(5, Math.round(reps * sets * 0.5));
}

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout) private readonly workouts: Repository<Workout>,
    @InjectRepository(WorkoutSession) private readonly sessions: Repository<WorkoutSession>,
    private readonly events: EventsGateway,
    private readonly characters: CharactersService,
  ) {}

  findAll(): Promise<Workout[]> {
    return this.workouts.find();
  }

  /**
   * POST /api/workouts/session (§6) — logs a completed session and grants XP.
   * xpEarned is still accepted on the signature for API compatibility with the
   * existing frontend request shape, but it is intentionally ignored: XP is
   * always computed server-side from `stats` via estimateXp() (audit Fix #1 —
   * never trust client-provided XP).
   */
  async logSession(
    userId: string,
    workoutId: string,
    stats: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    xpEarned?: number,
  ): Promise<WorkoutSession> {
    const workout = await this.workouts.findOne({ where: { id: workoutId } });
    if (!workout) throw new NotFoundException('Workout not found.');

    const session = await this.sessions.save(
      this.sessions.create({
        userId,
        workoutId,
        startTime: new Date(),
        endTime: new Date(),
        stats,
      }),
    );

    const xp = estimateXp(stats);
    await this.characters.grantExp(userId, xp, `workout:${workoutId}`);

    // §6/§10 WebSocket event: workout:progress
    this.events.emitToUser(userId, 'workout:progress', {
      sessionId: session.id,
      workoutId,
      xpEarned: xp,
      stats,
    });

    return session;
  }

  findHistoryForUser(userId: string): Promise<WorkoutSession[]> {
    return this.sessions.find({
      where: { userId },
      relations: ['workout'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
