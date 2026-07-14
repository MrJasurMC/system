import { IsInt, IsObject, IsOptional, IsUUID, Min } from 'class-validator';

export class StartWorkoutSessionDto {
  @IsUUID()
  workoutId: string;
}

export class CompleteWorkoutSessionDto {
  @IsObject()
  stats: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpEarned?: number;
}
