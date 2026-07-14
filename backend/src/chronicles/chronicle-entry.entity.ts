import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ChronicleType {
  QUEST = 'quest',
  BOSS = 'boss',
  PROMOTION = 'promotion',
  STORY = 'story',
  EVENT = 'event',
  REWARD = 'reward',
}

/** chronicles — §6. Historical log of the player's journey. */
@Entity('chronicles')
export class ChronicleEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ChronicleType })
  type: ChronicleType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
