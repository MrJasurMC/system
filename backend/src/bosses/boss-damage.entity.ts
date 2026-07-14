import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '@/users/user.entity';
import { WorldBoss } from './world-boss.entity';

@Entity('boss_damage')
export class BossDamage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  bossId: string;

  @ManyToOne(() => WorldBoss, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bossId' })
  boss: WorldBoss;

  @Column({ type: 'int' })
  damageDealt: number;

  @Column()
  exerciseType: string;

  @Column({ type: 'int', default: 1 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
