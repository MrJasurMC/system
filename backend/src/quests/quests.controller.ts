import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { UpdateQuestProgressDto } from './dto/quest.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

@Controller('quests')
export class QuestsController {
  constructor(private readonly quests: QuestsService) {}

  /** GET /api/quests — active quests visible to the caller (hidden quests filtered per §3). */
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.quests.findVisibleFor(user.id);
  }

  /** GET /api/quests/mine — caller's accepted quests + progress */
  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.quests.findMine(user.id);
  }

  /** POST /api/quests/:id/accept */
  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quests.accept(user.id, id);
  }

  /** POST /api/quests/:id/proof — required before claim on requiresProof quests */
  @Post(':id/proof')
  submitProof(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quests.submitProof(user.id, id);
  }

  /** PUT /api/quests/:id/progress */
  @Put(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateQuestProgressDto,
    @CurrentUser() user: User,
  ) {
    return this.quests.updateProgress(user.id, id, dto.progress);
  }
}
