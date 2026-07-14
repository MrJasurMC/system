import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemRarity } from './item.entity';

@Injectable()
export class ExchangeCron {
  private readonly logger = new Logger(ExchangeCron.name);

  constructor(
    @InjectRepository(Item) private readonly items: Repository<Item>,
  ) {}

  /**
   * Resets the System Exchange every Monday at 00:00 (Midnight).
   */
  @Cron('0 0 * * 1') // Every Monday at 00:00
  async handleExchangeReset() {
    this.logger.log('Starting weekly System Exchange reset...');

    // 1. Remove expired items from the rotating pool only — permanently
    // listed items (weekRotation: false, e.g. weapons) stay in the
    // Exchange across resets.
    await this.items.update(
      { inExchange: true, weekRotation: true },
      { inExchange: false, exchangeExpiresAt: null }
    );

    // 2. Randomly select new items for the exchange based on rarity.
    const availableItems = await this.items
      .createQueryBuilder('item')
      .where('item.isLimited = :isLimited', { isLimited: false })
      .andWhere('item.goldPrice > :goldPrice', { goldPrice: 0 })
      .andWhere('item.weekRotation = :weekRotation', { weekRotation: true })
      .getMany();

    if (availableItems.length === 0) {
      this.logger.warn('No valid items found for the exchange reset.');
      return;
    }

    const shuffle = (array: Item[]) => array.sort(() => 0.5 - Math.random());
    
    const commons = shuffle(availableItems.filter(i => i.rarity === ItemRarity.COMMON)).slice(0, 5);
    const rares = shuffle(availableItems.filter(i => i.rarity === ItemRarity.RARE)).slice(0, 3);
    const epics = shuffle(availableItems.filter(i => i.rarity === ItemRarity.EPIC)).slice(0, 1);
    
    // Legendary is rarer, maybe 50% chance to appear
    const legendaries = Math.random() > 0.5 
      ? shuffle(availableItems.filter(i => i.rarity === ItemRarity.LEGENDARY)).slice(0, 1)
      : [];

    const newItems = [...commons, ...rares, ...epics, ...legendaries];

    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);

    for (const item of newItems) {
      item.inExchange = true;
      item.exchangeExpiresAt = nextMonday;
      await this.items.save(item);
    }

    this.logger.log(`Exchange reset complete. Added ${newItems.length} items to the exchange.`);
  }
}
