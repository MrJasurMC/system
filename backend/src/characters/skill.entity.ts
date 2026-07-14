import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Character } from './character.entity';

export enum SkillType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  ULTIMATE = 'ultimate',
}

/** skills — §5. Skills & abilities unlocked as the character grows. */
@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  characterId: string;

  @ManyToOne(() => Character, (character) => character.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SkillType, default: SkillType.ACTIVE })
  type: SkillType;

  @Column({ default: 1 })
  level: number;

  @Column({ default: false })
  unlocked: boolean;

  /** Cooldown in seconds. */
  @Column({ default: 0 })
  cooldown: number;
}
