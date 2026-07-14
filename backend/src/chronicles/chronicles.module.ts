import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChronicleEntry } from './chronicle-entry.entity';
import { ChroniclesService } from './chronicles.service';
import { ChroniclesController } from './chronicles.controller';
import { RealtimeModule } from '@/realtime/realtime.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChronicleEntry]),
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [ChroniclesService],
  controllers: [ChroniclesController],
  exports: [ChroniclesService],
})
export class ChroniclesModule {}
