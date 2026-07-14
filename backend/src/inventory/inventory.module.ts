import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './inventory-item.entity';
import { Item } from './item.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { RealtimeModule } from '@/realtime/realtime.module';
import { ExchangeCron } from './exchange.cron';
import { CharactersModule } from '@/characters/characters.module';
import { ChroniclesModule } from '@/chronicles/chronicles.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, Item]), RealtimeModule, CharactersModule, ChroniclesModule],
  providers: [InventoryService, ExchangeCron],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
