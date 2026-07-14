import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BossTier {
  COMMON = 'common',
  ELITE = 'elite',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  IMMORTAL = 'immortal',
}

@Entity('world_bosses')
export class WorldBoss {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  lore: string;

  /** Rarity tier — drives HP/reward scaling and the frontend's color theme. Immortal is the top tier. */
  @Column({ type: 'varchar', default: BossTier.COMMON })
  tier: BossTier;

  /** Expected JSON structure: { "minLevel": 10, "requiredQuest": "uuid" } */
  @Column({ type: 'jsonb', nullable: true })
  requirements?: Record<string, any>;

  /** Expected JSON structure: { "xp": 50000, "gold": 10000, "itemIds": [...] } */
  @Column({ type: 'jsonb', nullable: true })
  rewards?: Record<string, any>;

  @Column({ type: 'bigint' })
  hp: number;

  @Column({ type: 'bigint' })
  maxHp: number;

  @Column({ type: 'int' })
  weekNumber: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
