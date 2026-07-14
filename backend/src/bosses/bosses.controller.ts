import { Controller, Get, Post, Body } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BossesService } from './bosses.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

// Keep in sync with the exerciseType switch in BossesService.submitDamage.
const EXERCISE_TYPES = ['pushup', 'squat', 'pullup', 'plank', 'running'] as const;

class SubmitDamageDto {
  @IsUUID()
  bossId: string;

  @IsIn(EXERCISE_TYPES)
  exerciseType: string;

  // Upper bound is a sanity cap on a single submission (audit Fix #2) — the
  // service re-derives/clamps this again server-side as defense in depth.
  @IsInt()
  @Min(1)
  @Max(500)
  amount: number;

  // Optional: the specific weapon (inventory item id) picked from the
  // "choose weapon" panel for this attack. If omitted, falls back to
  // whatever's globally equipped (and doesn't consume durability).
  @IsOptional()
  @IsUUID()
  weaponId?: string;
}

@Controller('bosses')
export class BossesController {
  constructor(private readonly bossesService: BossesService) {}

  @Get('active')
  getActiveBoss() {
    return this.bossesService.getActiveBoss();
  }

  @Get('status')
  getStatus() {
    return this.bossesService.getStatus();
  }

  @Post('damage')
  submitDamage(@CurrentUser() user: User, @Body() dto: SubmitDamageDto) {
    return this.bossesService.submitDamage(user.id, dto.bossId, dto.exerciseType, dto.amount, dto.weaponId);
  }
}
