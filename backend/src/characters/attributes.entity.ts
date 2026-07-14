import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Character } from './character.entity';

/** attributes — §5. Six core stats, 1:1 with a character. */
@Entity('attributes')
export class Attributes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  characterId: string;

  @OneToOne(() => Character, (character) => character.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column({ default: 10 })
  strength: number;

  @Column({ default: 10 })
  endurance: number;

  @Column({ default: 10 })
  agility: number;

  @Column({ default: 10 })
  speed: number;

  @Column({ default: 10 })
  recovery: number;

  /**
   * §1 — non-physical stats added by the quest rework. Kept on the same
   * Attributes row (not a new table) since they share the exact same
   * point-allocation / stat-XP mechanics as the physical stats above.
   *
   * discipline: promoted from Character.disciplineScore's role — streaks,
   *   on-time completion. Wisdom/Mentality/Social/Luck from the original
   *   brief were folded in here or into Focus/Charisma/Knowledge respectively
   *   (see quest-rework-design.md §1) rather than kept as separate dead
   *   stats nothing would ever feed.
   */
  @Column({ default: 10 })
  discipline: number;

  @Column({ default: 10 })
  focus: number;

  @Column({ default: 10 })
  programming: number;

  @Column({ default: 10 })
  knowledge: number;

  @Column({ default: 10 })
  charisma: number;

  @Column({ default: 10 })
  finance: number;

  /** Unspent points from level-ups, allocatable by the player. */
  @Column({ default: 0 })
  unallocatedPoints: number;
}
