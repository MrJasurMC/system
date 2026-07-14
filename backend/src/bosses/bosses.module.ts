import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldBoss } from './world-boss.entity';
import { BossDamage } from './boss-damage.entity';
import { BossesService } from './bosses.service';
import { BossesController } from './bosses.controller';
import { CharactersModule } from '@/characters/characters.module';
import { InventoryModule } from '@/inventory/inventory.module';

import { NotificationsModule } from '@/notifications/notifications.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { AchievementsModule } from '@/achievements/achievements.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorldBoss, BossDamage]), CharactersModule, InventoryModule, NotificationsModule, RealtimeModule, AchievementsModule],
  providers: [BossesService],
  controllers: [BossesController],
  exports: [BossesService],
})
export class BossesModule {}
