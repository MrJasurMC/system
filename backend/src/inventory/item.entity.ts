import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  CELESTIAL = 'celestial',
}

export enum ItemType {
  REWARD = 'reward',
  COSMETIC = 'cosmetic',
  WEAPON = 'weapon',
}

export enum ItemCategory {
  ENTERTAINMENT = 'entertainment',
  FOOD = 'food',
  RECOVERY = 'recovery',
  LIFESTYLE = 'lifestyle',
  PREMIUM = 'premium',
}

/** items — §5. The item catalog (definitions). */
@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ItemType, default: ItemType.REWARD })
  type: ItemType;

  @Column({ type: 'enum', enum: ItemRarity, default: ItemRarity.COMMON })
  rarity: ItemRarity;

  @Column({ type: 'enum', enum: ItemCategory, default: ItemCategory.LIFESTYLE })
  category: ItemCategory;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  /** Gold price in the System Exchange. 0 = not purchasable. */
  @Column({ type: 'int', default: 0 })
  goldPrice: number;

  /** Gold returned when sold (always lower than goldPrice). */
  @Column({ type: 'int', default: 0 })
  sellValue: number;

  /** Maximum a player may purchase per week. 0 = unlimited. */
  @Column({ type: 'int', default: 0 })
  maxPerWeek: number;

  /** Flat bonus damage per rep against World Bosses while this weapon is equipped. Only meaningful for type WEAPON. */
  @Column({ type: 'int', default: 0 })
  attackBonus: number;

  /**
   * How many boss attacks a single copy of this weapon survives before
   * breaking. 0 = unbreakable (default for non-weapons and any weapon that
   * isn't meant to be a consumable). Higher attackBonus should generally
   * come with a lower maxDurability — a 10k-damage weapon that never breaks
   * would trivialize every future World Boss.
   */
  @Column({ type: 'int', default: 0 })
  maxDurability: number;

  /** Expected JSON structure: { "requiredStreak": 30, "requiredLevel": 10 } */
  @Column({ type: 'jsonb', nullable: true })
  unlockRequirements?: Record<string, any>;

  /** Whether this item is eligible for the weekly shop rotation. */
  @Column({ default: true })
  weekRotation: boolean;

  /** Whether this item is currently listed in the System Exchange. */
  @Column({ default: false })
  inExchange: boolean;

  /** When this Exchange listing expires (set on Monday reset). */
  @Column({ type: 'timestamp', nullable: true })
  exchangeExpiresAt?: Date | null;

  /** Limited items never return to the Exchange unless manually re-enabled. */
  @Column({ default: false })
  isLimited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => InventoryItem, (ii) => ii.item)
  inventoryEntries: InventoryItem[];
}

