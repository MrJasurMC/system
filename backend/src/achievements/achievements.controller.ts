import { Controller, Get } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  /** GET /api/achievements */
  @Get()
  findAll() {
    return this.achievements.findAll();
  }

  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.achievements.findForUser(user.id);
  }
}
