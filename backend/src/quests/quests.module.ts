import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './quest.entity';
import { QuestProgress } from './quest-progress.entity';
import { QuestPrerequisite } from './quest-prerequisite.entity';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { QuestGeneratorService } from './quest-generator.service';
import { RealtimeModule } from '@/realtime/realtime.module';
import { CharactersModule } from '@/characters/characters.module';
import { ChroniclesModule } from '@/chronicles/chronicles.module';
import { InventoryModule } from '@/inventory/inventory.module';
import { AchievementsModule } from '@/achievements/achievements.module';
import { User } from '@/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quest, QuestProgress, QuestPrerequisite, User]), RealtimeModule, CharactersModule, ChroniclesModule, InventoryModule, AchievementsModule],
  providers: [QuestsService, QuestGeneratorService],
  controllers: [QuestsController],
  exports: [QuestsService],
})
export class QuestsModule {}
