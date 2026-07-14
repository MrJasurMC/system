import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '@/users/user.entity';
import { Item } from './item.entity';

/** inventory_items — §5. Per-user ownership of items. */
@Entity('inventory_items')
@Index(['userId', 'itemId'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  itemId: string;

  @ManyToOne(() => Item, (item) => item.inventoryEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: false })
  equipped: boolean;

  /**
   * Uses left on the current copy of this item, for weapons with
   * maxDurability > 0. Null = not a durability-tracked item (unbreakable or
   * non-weapon). When this hits 0, InventoryService.consumeDurability drops
   * `quantity` by 1 and resets this back to the item's maxDurability if
   * another copy remains, otherwise removes the row and auto-unequips.
   */
  @Column({ type: 'int', nullable: true })
  remainingDurability: number | null;

  /**
   * How many times this item has been bought from the Exchange during the
   * current weekly window (tracked separately from `quantity`, which also
   * grows from non-purchase grants such as boss/achievement rewards and
   * would otherwise make the maxPerWeek check meaningless).
   */
  @Column({ type: 'int', default: 0 })
  weeklyPurchases: number;

  /** When `weeklyPurchases` should next reset to 0 (next Monday 00:00 after the purchase that started the window). */
  @Column({ type: 'timestamp', nullable: true })
  weeklyPurchasesResetAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
