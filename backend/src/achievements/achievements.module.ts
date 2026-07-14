import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { RealtimeModule } from '@/realtime/realtime.module';
import { InventoryModule } from '@/inventory/inventory.module';
import { CharactersModule } from '@/characters/characters.module';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement]), RealtimeModule, InventoryModule, CharactersModule],
  providers: [AchievementsService],
  controllers: [AchievementsController],
  exports: [AchievementsService],
})
export class AchievementsModule {}
