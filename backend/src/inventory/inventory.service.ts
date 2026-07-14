import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { Item, ItemType } from './item.entity';
import { Character } from '@/characters/character.entity';
import { EventsGateway } from '@/realtime/events.gateway';
import { CharactersService } from '@/characters/characters.service';
import { ChroniclesService } from '@/chronicles/chronicles.service';
import { ChronicleType } from '@/chronicles/chronicle-entry.entity';

/** Midnight of the next Monday after `from` (mirrors ExchangeCron's reset schedule). */
function nextMondayMidnight(from: Date): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + ((1 + 7 - next.getDay()) % 7 || 7));
  next.setHours(0, 0, 0, 0);
  return next;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem) private readonly inventory: Repository<InventoryItem>,
    @InjectRepository(Item) private readonly items: Repository<Item>,
    private readonly events: EventsGateway,
    private readonly characters: CharactersService,
    private readonly chronicles: ChroniclesService,
    private readonly dataSource: DataSource,
  ) {}

  findForUser(userId: string): Promise<InventoryItem[]> {
    return this.inventory.find({ where: { userId }, relations: ['item'], order: { updatedAt: 'DESC' } });
  }

  /** Returns items currently listed in the System Exchange. */
  getExchangeItems(): Promise<Item[]> {
    return this.items
      .createQueryBuilder('item')
      .where('item.inExchange = true')
      .andWhere('(item.exchangeExpiresAt IS NULL OR item.exchangeExpiresAt > NOW())')
      .orderBy('item.rarity', 'DESC')
      .addOrderBy('item.goldPrice', 'ASC')
      .getMany();
  }

  /** Grants an item to a user, stacking quantity if already owned. Fires item:obtained (§6). */
  async grant(userId: string, itemId: string, quantity = 1): Promise<InventoryItem> {
    const item = await this.items.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found.');

    let entry = await this.inventory.findOne({ where: { userId, itemId } });
    if (entry) {
      entry.quantity += quantity;
      // A fresh grant while the player is already out of durability on
      // their current copy (or never had this item before) tops them back
      // up — same idea as buying a fresh weapon off the shelf.
      if (item.maxDurability > 0 && (entry.remainingDurability ?? 0) <= 0) {
        entry.remainingDurability = item.maxDurability;
      }
    } else {
      entry = this.inventory.create({
        userId,
        itemId,
        quantity,
        remainingDurability: item.maxDurability > 0 ? item.maxDurability : null,
      });
    }
    await this.inventory.save(entry);

    this.events.emitToUser(userId, 'item:obtained', { itemId, quantity, name: item.name });
    return entry;
  }

  /**
   * Purchase an item from the System Exchange. Deducts Gold, grants item.
   *
   * Audit Fix (Phase 2 #3): balance check, gold deduction, weekly-limit
   * check, and item grant now all happen inside a single DB transaction with
   * a row lock on the character. Previously these were separate calls
   * (`characters.addGold` then `grant`), so two concurrent purchases could
   * both pass the balance check before either write committed — allowing
   * gold to go negative or a limited item to be bought more than once.
   */
  async purchaseFromExchange(userId: string, itemId: string): Promise<InventoryItem> {
    const { entry, item, goldSpent } = await this.dataSource.transaction(async (manager) => {
      const purchasedItem = await manager.findOne(Item, { where: { id: itemId, inExchange: true } });
      if (!purchasedItem) throw new NotFoundException('Item is not available in the Exchange.');
      if (purchasedItem.exchangeExpiresAt && purchasedItem.exchangeExpiresAt < new Date()) {
        throw new BadRequestException('This Exchange listing has expired.');
      }
      if (purchasedItem.goldPrice <= 0) throw new BadRequestException('This item is not purchasable.');

      // Lock the character row for the duration of the transaction so a
      // concurrent purchase can't read a stale gold balance.
      const character = await manager.findOne(Character, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!character) throw new NotFoundException('Character not found.');
      if ((character.gold ?? 0) < purchasedItem.goldPrice) {
        throw new BadRequestException('Insufficient Gold.');
      }

      // Check unlock requirements (e.g. requiredStreak)
      if (purchasedItem.unlockRequirements) {
        const reqs = purchasedItem.unlockRequirements;
        if (reqs.requiredLevel && character.level < reqs.requiredLevel) {
          throw new BadRequestException(`Requires level ${reqs.requiredLevel}.`);
        }
        if (reqs.requiredStreak && character.currentStreak < reqs.requiredStreak) {
          throw new BadRequestException(`Requires a ${reqs.requiredStreak}-day streak.`);
        }
      }

      // Lock (or create) the inventory row up front, since it's also what
      // tracks the weekly purchase count below — locking it here keeps two
      // concurrent purchases of the same item from both reading a stale
      // weeklyPurchases value, the same way the character row is locked
      // above for gold.
      let inventoryEntry = await manager.findOne(InventoryItem, {
        where: { userId, itemId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inventoryEntry) {
        inventoryEntry = manager.create(InventoryItem, {
          userId,
          itemId,
          quantity: 0,
          weeklyPurchases: 0,
          weeklyPurchasesResetAt: null,
        });
      }

      // Check weekly limit. `quantity` isn't usable here since it also
      // grows from non-purchase grants (boss/achievement rewards), so we
      // track purchase count separately and roll it over once the window
      // (next Monday 00:00 after the first purchase in the window) passes.
      const now = new Date();
      if (inventoryEntry.weeklyPurchasesResetAt && inventoryEntry.weeklyPurchasesResetAt <= now) {
        inventoryEntry.weeklyPurchases = 0;
        inventoryEntry.weeklyPurchasesResetAt = null;
      }
      if (purchasedItem.maxPerWeek > 0 && inventoryEntry.weeklyPurchases >= purchasedItem.maxPerWeek) {
        throw new BadRequestException(`You may only purchase this item ${purchasedItem.maxPerWeek}x per week.`);
      }

      // Deduct Gold
      character.gold = (character.gold ?? 0) - purchasedItem.goldPrice;
      await manager.save(character);

      // Grant item (stacking quantity if already owned) and record the purchase.
      inventoryEntry.quantity += 1;
      inventoryEntry.weeklyPurchases += 1;
      if (!inventoryEntry.weeklyPurchasesResetAt) {
        inventoryEntry.weeklyPurchasesResetAt = nextMondayMidnight(now);
      }
      await manager.save(inventoryEntry);

      return { entry: inventoryEntry, item: purchasedItem, goldSpent: purchasedItem.goldPrice };
    });

    // Side effects fire only after the transaction has committed.
    this.events.emitToUser(userId, 'item:obtained', { itemId, quantity: entry.quantity, name: item.name });
    this.events.emitToUser(userId, 'exchange:purchased', { itemId, name: item.name, goldSpent });
    return entry;
  }

  /**
   * Equips a weapon, unequipping any other weapon the player currently has
   * equipped (only one active at a time — that's what BossesService reads
   * for the attack-damage bonus). Non-weapon items don't affect combat, but
   * we still let them toggle `equipped` for cosmetic display purposes.
   */
  async equip(userId: string, itemId: string): Promise<InventoryItem> {
    const entry = await this.inventory.findOne({ where: { userId, itemId }, relations: ['item'] });
    if (!entry) throw new NotFoundException('You do not own this item.');

    if (entry.item.type === ItemType.WEAPON) {
      await this.inventory
        .createQueryBuilder()
        .update(InventoryItem)
        .set({ equipped: false })
        .where('userId = :userId', { userId })
        .andWhere('itemId IN (SELECT id FROM items WHERE type = :type)', { type: ItemType.WEAPON })
        .execute();
    }

    entry.equipped = true;
    await this.inventory.save(entry);
    this.events.emitToUser(userId, 'item:equipped', { itemId, name: entry.item.name });
    return entry;
  }

  async unequip(userId: string, itemId: string): Promise<InventoryItem> {
    const entry = await this.inventory.findOne({ where: { userId, itemId } });
    if (!entry) throw new NotFoundException('You do not own this item.');
    entry.equipped = false;
    await this.inventory.save(entry);
    return entry;
  }

  /** Returns the flat attack-damage bonus from the player's currently equipped weapon, or 0 if none. */
  async getEquippedWeaponBonus(userId: string): Promise<number> {
    const entry = await this.inventory.findOne({
      where: { userId, equipped: true, item: { type: ItemType.WEAPON } },
      relations: ['item'],
    });
    return entry?.item?.attackBonus ?? 0;
  }

  /**
   * Spends one use of a specific weapon instance against a boss attack.
   * Locks the row so concurrent attack submissions can't both read the same
   * remainingDurability and let a weapon survive one hit past its limit.
   * Returns the attackBonus to apply to that hit, and whether this use broke
   * the weapon (quantity fully exhausted).
   */
  async consumeDurability(
    userId: string,
    itemId: string,
  ): Promise<{ attackBonus: number; broke: boolean; name: string }> {
    return this.dataSource.transaction(async (manager) => {
      const entry = await manager.findOne(InventoryItem, {
        where: { userId, itemId },
        relations: ['item'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!entry) throw new NotFoundException('You do not own this weapon.');
      if (entry.item.type !== ItemType.WEAPON) {
        throw new BadRequestException('That item is not a weapon.');
      }

      const attackBonus = entry.item.attackBonus;

      // maxDurability 0 = unbreakable, nothing to consume.
      if (entry.item.maxDurability <= 0) {
        return { attackBonus, broke: false, name: entry.item.name };
      }

      const remaining = (entry.remainingDurability ?? entry.item.maxDurability) - 1;
      let broke = false;

      if (remaining > 0) {
        entry.remainingDurability = remaining;
        await manager.save(entry);
      } else {
        // This copy is spent. Consume one from quantity; if another copy is
        // owned, hand it a fresh durability bar, otherwise remove the row
        // entirely (and it was necessarily unequipped by breaking).
        entry.quantity -= 1;
        broke = true;
        if (entry.quantity > 0) {
          entry.remainingDurability = entry.item.maxDurability;
          entry.equipped = false;
          await manager.save(entry);
        } else {
          await manager.remove(entry);
        }
      }

      return { attackBonus, broke, name: entry.item.name };
    });
  }

  /** Looks up a weapon a user owns, for the explicit "choose weapon to attack with" flow. */
  async getOwnedWeapon(userId: string, itemId: string): Promise<InventoryItem | null> {
    return this.inventory.findOne({
      where: { userId, itemId, item: { type: ItemType.WEAPON } },
      relations: ['item'],
    });
  }

  /** Sell an item for its sellValue in Gold. */
  async sellItem(userId: string, itemId: string): Promise<void> {
    const entry = await this.inventory.findOne({ where: { userId, itemId }, relations: ['item'] });
    if (!entry) throw new NotFoundException('You do not own this item.');
    if (entry.equipped) throw new BadRequestException('Unequip the item before selling.');

    const goldGained = entry.item.sellValue ?? 0;

    entry.quantity -= 1;
    if (entry.quantity <= 0) {
      await this.inventory.remove(entry);
    } else {
      await this.inventory.save(entry);
    }

    if (goldGained > 0) {
      await this.characters.addGold(userId, goldGained);
    }

    this.events.emitToUser(userId, 'item:sold', { itemId, name: entry.item.name, goldGained });
  }

  /** POST /api/inventory/use/:id (§6) — consumes a real life reward. */
  async use(userId: string, itemId: string): Promise<InventoryItem> {
    const entry = await this.inventory.findOne({ where: { userId, itemId }, relations: ['item'] });
    if (!entry) throw new NotFoundException('You do not own this item.');

    if (entry.item.type === ItemType.REWARD) {
      if (entry.quantity <= 0) throw new BadRequestException('No quantity remaining.');
      entry.quantity -= 1;
      
      // Log consumption to chronicles
      await this.chronicles.logEvent(
        userId,
        ChronicleType.REWARD,
        'Reward Claimed',
        `Consumed Real Life Reward: ${entry.item.name}`,
        { itemId: entry.item.id }
      );
      
      if (entry.quantity === 0) {
        await this.inventory.remove(entry);
        return entry;
      }
      return this.inventory.save(entry);
    }

    throw new BadRequestException('This item type cannot be used directly.');
  }
}
