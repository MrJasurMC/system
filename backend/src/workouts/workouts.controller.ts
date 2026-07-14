import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsObject, IsOptional, IsInt, IsUUID, Min } from 'class-validator';
import { WorkoutsService } from './workouts.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

class LogSessionDto {
  @IsUUID()
  workoutId: string;

  @IsObject()
  stats: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpEarned?: number;
}

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  /** GET /api/workouts — the exercise library */
  @Get()
  findAll() {
    return this.workouts.findAll();
  }

  /** GET /api/workouts/history — caller's session log */
  @Get('history')
  history(@CurrentUser() user: User) {
    return this.workouts.findHistoryForUser(user.id);
  }

  /** POST /api/workouts/session (§6) */
  @Post('session')
  logSession(@Body() dto: LogSessionDto, @CurrentUser() user: User) {
    return this.workouts.logSession(user.id, dto.workoutId, dto.stats, dto.xpEarned);
  }
}
