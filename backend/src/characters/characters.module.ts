import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './character.entity';
import { Attributes } from './attributes.entity';
import { Skill } from './skill.entity';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { LeaderboardController } from './leaderboard.controller';
import { RealtimeModule } from '@/realtime/realtime.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ChroniclesModule } from '@/chronicles/chronicles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Attributes, Skill]), RealtimeModule, NotificationsModule, ChroniclesModule],
  providers: [CharactersService],
  controllers: [CharactersController, LeaderboardController],
  exports: [CharactersService],
})
export class CharactersModule {}
