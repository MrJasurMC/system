import { Controller, Get } from '@nestjs/common';
import { ChroniclesService } from './chronicles.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

@Controller('chronicles')
export class ChroniclesController {
  constructor(private readonly chronicles: ChroniclesService) {}

  /** GET /api/chronicles — returns the user's historical log timeline */
  @Get()
  getTimeline(@CurrentUser() user: User) {
    return this.chronicles.getTimeline(user.id);
  }
}
