import { Controller, Get } from '@nestjs/common';
import { CharactersService } from '@/characters/characters.service';
import { Public } from '@/common/decorators/public.decorator';

/** GET /api/leaderboard (§6) — public, no auth required to view rankings. */
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly characters: CharactersService) {}

  @Public()
  @Get()
  get() {
    return this.characters.getLeaderboard();
  }
}
