import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * quest_prerequisites — supports quests that need more than one prerequisite
 * (e.g. a campaign capstone requiring several quest lines complete), which
 * Quest.requiredPreviousQuestId can't express on its own since it's a single
 * FK. A quest can have zero, one, or many rows here; accept() in
 * QuestsService checks both requiredPreviousQuestId AND every row here for
 * the target quest before allowing an accept.
 */
@Entity('quest_prerequisites')
@Index(['questId', 'requiredQuestId'], { unique: true })
export class QuestPrerequisite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The quest that is gated. */
  @Index()
  @Column()
  questId: string;

  /** A quest that must be CLAIMED before `questId` can be accepted. */
  @Column()
  requiredQuestId: string;

  @CreateDateColumn()
  createdAt: Date;
}
