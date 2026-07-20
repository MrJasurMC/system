import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Quest, QuestType, QuestDifficulty } from './quest.entity';
import { QuestProgress, QuestStatus } from './quest-progress.entity';
import { QuestPrerequisite } from './quest-prerequisite.entity';
import { EventsGateway } from '@/realtime/events.gateway';
import { CharactersService } from '@/characters/characters.service';
import { ChroniclesService } from '@/chronicles/chronicles.service';
import { ChronicleType } from '@/chronicles/chronicle-entry.entity';
import { InventoryService } from '@/inventory/inventory.service';
import { AchievementsService } from '@/achievements/achievements.service';
import { QuestGeneratorService } from './quest-generator.service';
import { nextLocalResetTime } from '@/common/timezone.util';

/**
 * Maps the six Project Toji chain titles (from seed_toji_quests.ts) to a
 * stable slug used for pillar achievement keys — e.g. "Steel Core" ->
 * "steel_core" -> achievement key "pillar_steel_core_rank_f". Titles are
 * matched with the leading "The " stripped since two lines use it
 * ("The Predator's Back", "The Broad Shoulders") and two don't.
 */
const PILLAR_SLUGS: Record<string, string> = {
  'Steel Core': 'steel_core',
  "Predator's Back": 'predators_back',
  'Titan Arms': 'titan_arms',
  'Iron Grip': 'iron_grip',
  'Broad Shoulders': 'broad_shoulders',
  'Monster Legs': 'monster_legs',
};
const ALL_PILLAR_SLUGS = Object.values(PILLAR_SLUGS);
const RANK_ORDER = ['f', 'e', 'd', 'c', 'b', 'a'];

function parseChainQuestTitle(title: string): { pillar: string; rank: string } | null {
  const match = title.match(/^(.+?)\s+—\s+Rank\s+([A-Za-z])$/);
  if (!match) return null;
  const lineTitle = match[1].replace(/^The\s+/, '').trim();
  const slug = PILLAR_SLUGS[lineTitle];
  if (!slug) return null;
  return { pillar: slug, rank: match[2].toLowerCase() };
}

@Injectable()
export class QuestsService implements OnModuleInit {
  private readonly logger = new Logger(QuestsService.name);

  constructor(
    @InjectRepository(Quest) private readonly quests: Repository<Quest>,
    @InjectRepository(QuestProgress) private readonly questProgress: Repository<QuestProgress>,
    @InjectRepository(QuestPrerequisite) private readonly questPrerequisites: Repository<QuestPrerequisite>,
    private readonly events: EventsGateway,
    private readonly characters: CharactersService,
    private readonly chronicles: ChroniclesService,
    private readonly inventory: InventoryService,
    private readonly achievements: AchievementsService,
    private readonly questGenerator: QuestGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Runs once on every backend boot — retires the pre-rework quest catalog
   * (Steel Core/Predator's Back/etc pillar chains, story quests, and the old
   * "Daily Discipline" habit quest) regardless of whether a DB migration
   * was ever run. This is what the migration's `up()` also does, but doing
   * it here too means `npm i && npm run start:dev` alone is enough — no
   * separate `migration:run` step required, which matches how this repo's
   * `synchronize: true` dev setup already auto-applies schema changes.
   * Idempotent: safe to run on every restart.
   */
  async onModuleInit() {
    try {
      const stale = await this.quests.find({
        where: [{ type: QuestType.STORY }, { type: QuestType.CHAIN }, { title: 'Daily Discipline' }],
      });
      if (stale.length === 0) return;

      const staleIds = stale.map((q) => q.id);
      await this.quests.update(staleIds, { active: false });

      const staleProgress = await this.questProgress.find({
        where: staleIds.map((questId) => ({ questId, status: QuestStatus.ACCEPTED })),
      });
      const staleInProgress = await this.questProgress.find({
        where: staleIds.map((questId) => ({ questId, status: QuestStatus.IN_PROGRESS })),
      });
      const toFail = [...staleProgress, ...staleInProgress];
      if (toFail.length > 0) {
        await this.questProgress.update(toFail.map((p) => p.id), { status: QuestStatus.FAILED });
      }

      this.logger.log(`Legacy quest cleanup: deactivated ${staleIds.length} quest(s), failed ${toFail.length} stale progress row(s).`);
    } catch (err) {
      this.logger.warn(`Legacy quest cleanup failed (non-fatal): ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Minimum wall-clock time (ms) that must pass between accepting a quest and
   * marking it COMPLETE, so a direct API call can't insta-claim a quest the
   * instant it's accepted. Scaled off the quest's own estimatedTime (30% of
   * it), with a 20s floor so even quick quests require *some* elapsed time.
   */
  private minCompletionDelayMs(estimatedTimeMinutes?: number): number {
    const floorMs = 20_000;
    if (!estimatedTimeMinutes || estimatedTimeMinutes <= 0) return floorMs;
    return Math.max(floorMs, estimatedTimeMinutes * 60_000 * 0.3);
  }

  /**
   * The app now only surfaces two quest types: the auto-generated Main
   * (daily workout) and Side (long-term goal) quests. Older catalog content
   * — Steel Core/Predator's Back/etc pillar chains, story quests, the old
   * Daily Discipline habit quest — is filtered out here regardless of what
   * still sits in the `quests` table (belt-and-suspenders on top of the
   * migration that deactivates it).
   */
  findAllActive(): Promise<Quest[]> {
    const now = new Date();
    return this.quests
      .createQueryBuilder('quest')
      .where('quest.active = :active', { active: true })
      .andWhere('quest.type IN (:...types)', { types: [QuestType.MAIN_DAILY, QuestType.SIDE] })
      // Belt-and-suspenders on top of expiry evaluation: a quest whose
      // reset window already passed (e.g. an old unaccepted "Pull Day"
      // quest from a previous day/version) shouldn't keep cluttering
      // everyone's catalog forever just because nobody ever accepted it.
      .andWhere('(quest.expiresAt IS NULL OR quest.expiresAt > :now)', { now })
      .getMany();
  }

  /**
   * §3 hidden quests — a hidden quest is filtered out of listings until its
   * revealCondition is met. Evaluated server-side only; the client never
   * gets to see a hidden quest exists before it unlocks. Currently supports
   * a streak-length condition (`{ type: 'streak', value: n }`); extend the
   * switch as new condition types are needed.
   */
  private async isRevealed(userId: string, quest: Quest): Promise<boolean> {
    if (!quest.hidden) return true;
    if (!quest.revealCondition) return false;

    const character = await this.characters.getByUserId(userId);
    switch (quest.revealCondition.type) {
      case 'streak':
        return character.currentStreak >= (quest.revealCondition.value ?? Infinity);
      case 'level':
        return character.level >= (quest.revealCondition.value ?? Infinity);
      default:
        return false;
    }
  }

  /**
   * Active quests visible to a specific user — active + not-hidden-or-revealed (§3).
   *
   * Runs the same dedupe/orphan sweep findMine() does before reading the
   * catalog. Previously only findMine() self-healed, so the Quests page's
   * "Available Contracts" list (served from here) could still render a
   * stale duplicate/orphaned card until someone happened to hit
   * GET /quests/mine first and clean it up.
   */
  async findVisibleFor(userId: string): Promise<Quest[]> {
    try {
      await this.dedupeActiveQuests(userId);
      await this.removeOrphanedGeneratedQuests(userId);
    } catch (err) {
      this.logger.warn(`Available-contracts self-heal failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
    }
    const all = await this.findAllActive();
    const flags = await Promise.all(all.map((q) => this.isRevealed(userId, q)));
    return all.filter((_, i) => flags[i]);
  }

  /**
   * GET /api/quests/mine — also self-heals: if the caller has no active
   * (accepted/in-progress) daily quest right now, generates one on the
   * spot instead of making them wait for the midnight cron. Covers both
   * a brand-new character (never had a daily quest yet) and a player who
   * just claimed today's quest and is refreshing the page.
   */
  async findMine(userId: string): Promise<QuestProgress[]> {
    try {
      // Was only evaluated once/day by the midnight cron, so an accepted
      // quest that expired mid-day stayed status=accepted (and kept
      // showing as the live "Active Mission" everywhere) until the next
      // cron run. Self-healing here means it flips to FAILED the moment
      // anyone loads a page after expiry, not up to 24h later.
      await this.questGenerator.evaluateFailedQuests(userId);
      await this.questGenerator.generateDailyQuest(userId);
    } catch (err) {
      this.logger.warn(`Daily quest self-heal failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
    }
    try {
      // Cleanup only — must never take down the read itself. A hiccup here
      // (bad legacy row, transient DB error) used to propagate straight out
      // of findMine() and 500 the Status + Quests pages on every single
      // load until someone fixed the underlying row by hand.
      await this.dedupeActiveQuests(userId);
      await this.removeOrphanedGeneratedQuests(userId);
    } catch (err) {
      this.logger.warn(`Quest cleanup self-heal failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
    }
    const all = await this.questProgress.find({ where: { userId }, relations: ['quest'] });
    return all.filter((p) => p.quest && (p.quest.type === QuestType.MAIN_DAILY || p.quest.type === QuestType.SIDE));
  }

  /**
   * One-time cleanup for accounts that already accumulated duplicate active
   * quests (e.g. two "Daily Discipline" cards) from the self-heal race that
   * generateDailyQuest's new per-user lock now prevents going forward. Keeps
   * the oldest duplicate of each kind, removes the rest.
   *
   * Key is quest TYPE for MAIN_DAILY/SIDE, not literal goal text. Goal text
   * used to be the key, which worked for MAIN_DAILY (always the same fixed
   * goal string) but silently missed Side quest duplicates: the Side pool
   * rotates through 9 templates, each with its own goal line ("Widen the
   * back..." vs "Lowest priority by design..."), so two Side quests from
   * two different templates never matched on goal text and both stayed
   * active forever — exactly the "Visible Abs" + "Massive V-Taper" both
   * showing at once bug. Only one MAIN_DAILY and one SIDE should ever be
   * active per user regardless of which template generated them; every
   * other quest type keeps the old goal-text key since those (chains,
   * story, etc.) are legitimately allowed to coexist.
   *
   * This used to only delete the duplicate `quest_progress` rows and leave
   * the underlying `quests` row behind. MAIN_DAILY/SIDE quests are 1:1 with
   * the progress row that was auto-accepted for them (nothing else ever
   * references them), so the orphaned `quests` row just sat there with no
   * progress attached — and findAllActive() (the "available contracts"
   * catalog) has no idea it was ever superseded, so it kept showing it as a
   * phantom duplicate "Accept Quest" card. Delete the quest row too, not
   * just the progress row.
   */
  async dedupeActiveQuests(userId: string): Promise<void> {
    const active = await this.questProgress.find({
      where: [{ userId, status: QuestStatus.ACCEPTED }, { userId, status: QuestStatus.IN_PROGRESS }],
      relations: ['quest'],
      order: { createdAt: 'ASC' },
    });
    const seenKeys = new Set<string>();
    const toRemove: QuestProgress[] = [];
    for (const entry of active) {
      // Defensive: a quest_progress row whose quest was already deleted
      // (dangling FK from a past bug, manual DB fix, etc.) used to crash
      // this whole self-heal step on entry.quest.goal — take it out
      // alongside real duplicates instead of throwing.
      if (!entry.quest) {
        toRemove.push(entry);
        continue;
      }
      const key =
        entry.quest.type === QuestType.MAIN_DAILY || entry.quest.type === QuestType.SIDE
          ? entry.quest.type // one active MAIN_DAILY / one active SIDE, regardless of template
          : `${entry.quest.type}:${entry.quest.goal}`;
      if (seenKeys.has(key)) {
        toRemove.push(entry);
      } else {
        seenKeys.add(key);
      }
    }
    if (toRemove.length) {
      const orphanedQuestIds = toRemove
        .filter((p) => p.quest && (p.quest.type === QuestType.MAIN_DAILY || p.quest.type === QuestType.SIDE))
        .map((p) => p.quest.id);
      await this.questProgress.remove(toRemove);
      if (orphanedQuestIds.length) {
        await this.quests.delete(orphanedQuestIds);
      }
      this.logger.log(`Removed ${toRemove.length} duplicate/dangling active quest(s) for user ${userId}`);
    }
  }

  /**
   * Sweeps up MAIN_DAILY/SIDE quest rows that already lost their progress
   * row before the fix above existed (or from any other past race) — a
   * generated quest of these types with nobody's progress pointing at it is
   * never going to be accepted by anyone, it's just clutter that keeps
   * showing up as a duplicate "available" card until its expiry lapses.
   */
  async removeOrphanedGeneratedQuests(userId: string): Promise<void> {
    // Skip anything inserted in the last 10s — it may be a quest another
    // user's in-flight generateDailyQuest() just created, whose
    // QuestProgress row hasn't committed yet. Without this window a
    // concurrent sweep can delete a quest out from under its own
    // still-running acceptQuest() call.
    const graceCutoff = new Date(Date.now() - 10_000);
    // Done as a single LEFT JOIN instead of "load every MAIN_DAILY/SIDE
    // quest system-wide, then query quest_progress with an OR-per-row IN
    // list" — that list only ever grows as the app accumulates quests
    // across every user, and was a real risk of an oversized/slow query
    // (or an outright crash) once there was enough history to sweep.
    const orphans = await this.quests
      .createQueryBuilder('quest')
      .leftJoin('quest_progress', 'progress', 'progress."questId" = quest.id')
      .where('quest.type IN (:...types)', { types: [QuestType.MAIN_DAILY, QuestType.SIDE] })
      .andWhere('quest.createdAt < :graceCutoff', { graceCutoff })
      .andWhere('progress.id IS NULL')
      .select('quest.id', 'id')
      .getRawMany<{ id: string }>();
    if (!orphans.length) return;

    await this.quests.delete(orphans.map((o) => o.id));
    this.logger.log(`Removed ${orphans.length} orphaned generated quest(s) while serving user ${userId}`);
  }

  /**
   * §3 quest trees — a quest with prerequisites can't be accepted until
   * every one of them has been CLAIMED by this user. Checks both
   * `requiredPreviousQuestId` (single parent, the original mechanism) and
   * `quest_prerequisites` (many parents, e.g. a capstone quest gated on
   * several quest lines finishing). Returns the titles of any unmet
   * prerequisites so the error message is actually useful.
   */
  private async unmetPrerequisites(userId: string, quest: Quest): Promise<string[]> {
    const requiredIds = new Set<string>();
    if (quest.requiredPreviousQuestId) requiredIds.add(quest.requiredPreviousQuestId);

    const extra = await this.questPrerequisites.find({ where: { questId: quest.id } });
    for (const p of extra) requiredIds.add(p.requiredQuestId);

    if (requiredIds.size === 0) return [];

    const claimed = await this.questProgress.find({
      where: { userId, status: QuestStatus.CLAIMED },
      select: ['questId'],
    });
    const claimedIds = new Set(claimed.map((c) => c.questId));

    const missingIds = [...requiredIds].filter((id) => !claimedIds.has(id));
    if (missingIds.length === 0) return [];

    const missingQuests = await this.quests.find({ where: missingIds.map((id) => ({ id })) });
    return missingQuests.map((q) => q.title);
  }

  /** POST /api/quests/:id/accept (§6) */
  async accept(userId: string, questId: string): Promise<QuestProgress> {
    const quest = await this.quests.findOne({ where: { id: questId, active: true } });
    if (!quest) throw new NotFoundException('Quest not found.');

    if (!(await this.isRevealed(userId, quest))) {
      throw new NotFoundException('Quest not found.');
    }

    const existing = await this.questProgress.findOne({ where: { userId, questId } });
    if (!existing) {
      const missing = await this.unmetPrerequisites(userId, quest);
      if (missing.length > 0) {
        throw new BadRequestException(
          `Complete "${missing.join('", "')}" before accepting this quest.`,
        );
      }
    }
    if (existing) {
      // Not a fresh accept — re-accepting a repeatable quest after a prior
      // claim. Enforce cooldown and dailyLimit (§6) before letting it reset.
      if (existing.status === QuestStatus.CLAIMED && quest.repeatable) {
        if (quest.cooldown && existing.lastClaimedAt) {
          const cooldownMs = quest.cooldown * 3_600_000;
          const elapsedMs = Date.now() - existing.lastClaimedAt.getTime();
          if (elapsedMs < cooldownMs) {
            const remainingHrs = Math.ceil((cooldownMs - elapsedMs) / 3_600_000);
            throw new BadRequestException(`Quest on cooldown — ${remainingHrs}h remaining.`);
          }
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const isNewDay = existing.lastClaimDate !== todayStr;
        const claimsSoFar = isNewDay ? 0 : existing.claimsToday;
        if (quest.dailyLimit != null && claimsSoFar >= quest.dailyLimit) {
          throw new BadRequestException('Daily limit reached for this quest.');
        }

        existing.status = QuestStatus.ACCEPTED;
        existing.progress = 0;
        return this.questProgress.save(existing);
      }
      return existing;
    }

    const created = await this.questProgress.save(
      this.questProgress.create({ userId, questId, status: QuestStatus.ACCEPTED, progress: 0 }),
    );

    // Pillar "started" achievements — fires on first-ever accept of a chain
    // quest, i.e. Rank F, since higher ranks only unlock after claiming the
    // one before. Non-fatal: an achievement-catalog gap shouldn't block accept.
    if (quest.type === QuestType.CHAIN) {
      const parsed = parseChainQuestTitle(quest.title);
      if (parsed && parsed.rank === 'f') {
        try {
          await this.achievements.bumpProgressByKey(userId, `pillar_${parsed.pillar}_started`, 1, 1);
        } catch (err) {
          this.logger.warn(`Achievement check failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    return created;
  }

  /** PUT /api/quests/:id/progress (§6) — also auto-completes and grants rewards at goal. */
  async updateProgress(userId: string, questId: string, progress: number): Promise<QuestProgress> {
    const entry = await this.questProgress.findOne({
      where: { userId, questId },
      relations: ['quest'],
    });
    if (!entry) throw new NotFoundException('Quest has not been accepted.');
    if (entry.status === QuestStatus.CLAIMED) {
      throw new BadRequestException('Quest already claimed.');
    }

    entry.progress = Math.min(progress, entry.quest.goalValue);

    const reachedGoal = entry.progress >= entry.quest.goalValue;
    const elapsedMs = Date.now() - entry.createdAt.getTime();
    const requiredMs = this.minCompletionDelayMs(entry.quest.estimatedTime);

    if (reachedGoal && elapsedMs < requiredMs) {
      // Goal value hit, but not enough real time has passed since the quest
      // was accepted — hold it at IN_PROGRESS instead of trusting the client.
      // This blocks the "accept then immediately PUT progress=goalValue" exploit.
      entry.progress = Math.max(0, entry.quest.goalValue - 1);
      entry.status = QuestStatus.IN_PROGRESS;
      await this.questProgress.save(entry);

      this.events.emitToUser(userId, 'quest:update', {
        questId,
        progress: entry.progress,
        status: entry.status,
      });

      const remainingSec = Math.ceil((requiredMs - elapsedMs) / 1000);
      throw new BadRequestException(
        `Too fast — wait ${remainingSec}s more before this quest can be completed.`,
      );
    }

    entry.status = reachedGoal ? QuestStatus.COMPLETE : QuestStatus.IN_PROGRESS;
    await this.questProgress.save(entry);

    // §6 WebSocket event: quest:update
    this.events.emitToUser(userId, 'quest:update', {
      questId,
      progress: entry.progress,
      status: entry.status,
    });

    if (entry.status === QuestStatus.COMPLETE) {
      await this.claim(userId, questId);
    }

    return entry;
  }

  /** POST /api/quests/:id/proof — marks proof submitted so requiresProof quests can be claimed (§6). */
  async submitProof(userId: string, questId: string): Promise<QuestProgress> {
    const entry = await this.questProgress.findOne({ where: { userId, questId } });
    if (!entry) throw new NotFoundException('Quest has not been accepted.');
    entry.proofSubmittedAt = new Date();
    return this.questProgress.save(entry);
  }

  private async claim(userId: string, questId: string): Promise<QuestProgress> {
    // Claim-and-flip-to-CLAIMED happens inside a row-locked transaction so two
    // concurrent requests (e.g. a retried/duplicated API call) can't both read
    // status=COMPLETE and both grant rewards before either write lands.
    const { entry, alreadyClaimed } = await this.dataSource.transaction(async (manager) => {
      // Lock the QuestProgress row alone — Postgres rejects FOR UPDATE when the
      // query also LEFT JOINs a relation (the joined side may be null), so the
      // `quest` relation has to be loaded in a separate, unlocked query.
      const locked = await manager.findOneOrFail(QuestProgress, {
        where: { userId, questId },
        lock: { mode: 'pessimistic_write' },
      });
      locked.quest = await manager.findOneOrFail(Quest, { where: { id: locked.questId } });

      if (locked.status === QuestStatus.CLAIMED) {
        return { entry: locked, alreadyClaimed: true };
      }
      if (locked.status !== QuestStatus.COMPLETE) {
        throw new BadRequestException('Quest is not complete yet.');
      }

      // §6 requiresProof — verification upload itself is a separate feature;
      // this is the enforcement hook so a claim can't land without it once
      // that feature exists. Proof is attached to progress.metadata by the
      // (future) upload endpoint before this claim call is made.
      if (locked.quest.requiresProof && !locked.proofSubmittedAt) {
        throw new BadRequestException('This quest requires proof of completion before it can be claimed.');
      }

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      locked.claimsToday = locked.lastClaimDate === todayStr ? locked.claimsToday + 1 : 1;
      locked.lastClaimDate = todayStr;
      locked.lastClaimedAt = now;

      locked.status = QuestStatus.CLAIMED;
      await manager.save(locked);
      return { entry: locked, alreadyClaimed: false };
    });

    if (alreadyClaimed) {
      // A concurrent request already granted rewards for this claim — return
      // the entry as-is instead of granting XP/gold a second time.
      return entry;
    }

    const { quest } = entry;

    // ─── Grant XP ──────────────────────────────────────────────────
    let characterAfterXp: Awaited<ReturnType<typeof this.characters.grantExp>> | undefined;
    if (quest.xpReward > 0) {
      characterAfterXp = await this.characters.grantExp(userId, quest.xpReward, `quest:${questId}`);
    }

    // ─── Grant Gold ─────────────────────────────────────────────────
    if (quest.goldReward > 0) {
      await this.characters.addGold(userId, quest.goldReward);
    }

    // ─── Grant Attribute Progress ────────────────────────────────────
    if (quest.attributeReward) {
      await this.characters.grantAttributeReward(userId, quest.attributeReward);
    }

    // ─── Grant Item Rewards ──────────────────────────────────────────
    if (quest.itemRewards && Array.isArray(quest.itemRewards.itemIds)) {
      for (const itemId of quest.itemRewards.itemIds) {
        try {
          await this.inventory.grant(userId, itemId, 1);
        } catch (err) {
          this.logger.warn(
            `Failed to grant item ${itemId} to user ${userId} for quest ${quest.id}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    }

    // ─── Combo / Momentum tracking (any quest type counts) ────────────
    const { combo, isNewBest } = await this.characters.registerMissionCombo(userId);

    // ─── Achievements: quest-completion-count milestones ──────────────
    // Non-fatal by design (same pattern as item-reward grants above) — an
    // achievement-catalog gap should never block a quest claim from
    // completing.
    try {
      await this.characters.incrementQuestsCompleted(userId);
      const totalClaimed = await this.questProgress.count({ where: { userId, status: QuestStatus.CLAIMED } });
      const milestones: [string, number][] = [
        ['quests_1', 1], ['quests_10', 10], ['quests_50', 50], ['quests_200', 200], ['quests_500', 500], ['quests_1000', 1000], ['quests_5000', 5000],
      ];
      for (const [key, goal] of milestones) {
        if (totalClaimed >= goal) {
          await this.achievements.bumpProgressByKey(userId, key, 1, 1);
        }
      }
      const comboMilestones: [string, number][] = [['combo_10', 10], ['combo_25', 25], ['combo_50', 50]];
      for (const [key, goal] of comboMilestones) {
        if (combo >= goal) {
          await this.achievements.setThresholdByKey(userId, key, combo, goal);
        }
      }

      // Level milestones — checked here (rather than inside CharactersService
      // itself) to avoid a circular module dependency, since AchievementsModule
      // already imports CharactersModule.
      if (characterAfterXp) {
        const levelMilestones: [string, number][] = [
          ['level_5', 5], ['level_10', 10], ['level_20', 20], ['level_35', 35], ['level_50', 50], ['level_75', 75], ['level_100', 100],
        ];
        for (const [key, goal] of levelMilestones) {
          if (characterAfterXp.level >= goal) {
            await this.achievements.setThresholdByKey(userId, key, characterAfterXp.level, goal);
          }
        }
        const streakMilestones: [string, number][] = [
          ['streak_1', 1], ['streak_3', 3], ['streak_7', 7], ['streak_14', 14], ['streak_30', 30],
          ['streak_60', 60], ['streak_100', 100], ['streak_150', 150], ['streak_200', 200],
          ['streak_365', 365], ['streak_500', 500],
        ];
        for (const [key, goal] of streakMilestones) {
          if (characterAfterXp.currentStreak >= goal) {
            await this.achievements.setThresholdByKey(userId, key, characterAfterXp.currentStreak, goal);
          }
        }

        // Peak gold ever held — setThresholdByKey's Math.max means this
        // naturally tracks a lifetime high-water mark even though gold goes
        // up and down as it's spent, with no extra counter column needed.
        const goldMilestones: [string, number][] = [
          ['gold_1000', 1000], ['gold_5000', 5000], ['gold_20000', 20000], ['gold_50000', 50000], ['gold_100000', 100000],
        ];
        for (const [key, goal] of goldMilestones) {
          if (characterAfterXp.gold >= goal) {
            await this.achievements.setThresholdByKey(userId, key, characterAfterXp.gold, goal);
          }
        }

        // Attribute milestones — single-stat mastery (hidden) and
        // well-rounded total (public).
        const attrs = characterAfterXp.attributes;
        if (attrs) {
          if (attrs.strength >= 50) {
            await this.achievements.setThresholdByKey(userId, 'secret_max_strength', attrs.strength, 50);
          }
          if (attrs.speed >= 50) {
            await this.achievements.setThresholdByKey(userId, 'secret_max_speed', attrs.speed, 50);
          }
          const attrTotal = attrs.strength + attrs.endurance + attrs.agility + attrs.speed + attrs.recovery;
          if (attrTotal >= 150) {
            await this.achievements.setThresholdByKey(userId, 'attribute_allocated_150', attrTotal, 150);
          }
        }
      }

      // Secret: claiming a daily quest between midnight and 4 AM local server time.
      const claimHour = new Date().getHours();
      if (claimHour >= 0 && claimHour < 4) {
        await this.achievements.bumpProgressByKey(userId, 'secret_night_owl', 1, 1);
      }
      // Secret: claiming before 6 AM (but outside the night-owl window above).
      if (claimHour >= 4 && claimHour < 6) {
        await this.achievements.bumpProgressByKey(userId, 'secret_early_bird', 1, 1);
      }

      // ─── Pillar chain achievements (Project Toji's six rank ladders) ──
      if (quest.type === QuestType.CHAIN) {
        const parsed = parseChainQuestTitle(quest.title);
        if (parsed) {
          // Per-pillar rank reached, e.g. pillar_steel_core_rank_f.
          await this.achievements.bumpProgressByKey(userId, `pillar_${parsed.pillar}_rank_${parsed.rank}`, 1, 1);
          if (parsed.rank === 'a') {
            await this.achievements.bumpProgressByKey(userId, 'first_pillar_mastered', 1, 1);
          }

          // Total chain-quest claims, regardless of pillar.
          const allClaimed = await this.questProgress.find({
            where: { userId, status: QuestStatus.CLAIMED },
            relations: ['quest'],
          });
          const chainClaims = allClaimed.filter((c) => c.quest.type === QuestType.CHAIN).length;
          const chainMilestones: [string, number][] = [['pillar_quests_10', 10], ['pillar_quests_20', 20], ['pillar_quests_36', 36]];
          for (const [key, goal] of chainMilestones) {
            if (chainClaims >= goal) {
              await this.achievements.bumpProgressByKey(userId, key, 1, 1);
            }
          }

          // Cross-pillar tier: all six lines have reached this rank or higher.
          const claimedTitles = allClaimed
            .map((c) => parseChainQuestTitle(c.quest.title))
            .filter((p): p is { pillar: string; rank: string } => !!p);

          const bestRankByPillar = new Map<string, number>();
          for (const p of claimedTitles) {
            const idx = RANK_ORDER.indexOf(p.rank);
            bestRankByPillar.set(p.pillar, Math.max(bestRankByPillar.get(p.pillar) ?? -1, idx));
          }
          for (let tier = 0; tier < RANK_ORDER.length; tier++) {
            const allAtTier = ALL_PILLAR_SLUGS.every((slug) => (bestRankByPillar.get(slug) ?? -1) >= tier);
            if (allAtTier) {
              await this.achievements.bumpProgressByKey(userId, `all_pillars_rank_${RANK_ORDER[tier]}`, 1, 1);
            }
          }
        }
      }

      // ─── Story milestones ──────────────────────────────────────────
      if (quest.type === QuestType.STORY) {
        if (quest.title === 'The Heavenly Restriction') {
          await this.achievements.bumpProgressByKey(userId, 'story_intro_claimed', 1, 1);
        }
        if (quest.title === 'The One Who Left It All Behind') {
          await this.achievements.bumpProgressByKey(userId, 'story_capstone_claimed', 1, 1);

          // Grand finale — capstone claimed after all six pillars hit Rank A.
          const claimed = await this.questProgress.find({ where: { userId, status: QuestStatus.CLAIMED }, relations: ['quest'] });
          const bestRankByPillar = new Map<string, number>();
          for (const c of claimed) {
            const p = parseChainQuestTitle(c.quest.title);
            if (!p) continue;
            const idx = RANK_ORDER.indexOf(p.rank);
            bestRankByPillar.set(p.pillar, Math.max(bestRankByPillar.get(p.pillar) ?? -1, idx));
          }
          const allMastered = ALL_PILLAR_SLUGS.every((slug) => (bestRankByPillar.get(slug) ?? -1) >= RANK_ORDER.length - 1);
          if (allMastered) {
            await this.achievements.bumpProgressByKey(userId, 'ascended', 1, 1);
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Achievement check failed for user ${userId}: ${err instanceof Error ? err.message : err}`);
    }

    // ─── WebSocket: quest claimed ────────────────────────────────────
    this.events.emitToUser(userId, 'quest:claimed', {
      questId,
      title: quest.title,
      type: quest.type,
      xpReward: quest.xpReward,
      goldReward: quest.goldReward,
      attributeReward: quest.attributeReward ?? null,
      combo,
      isNewBestCombo: isNewBest,
    });

    // ─── Log to Chronicle & Increase Discipline ──────────────────────
    const character = await this.characters.getByUserId(userId);
    character.disciplineScore += 1;
    await this.characters.saveCharacter(character);

    // ─── Streak: only the main daily quest advances it ────────────────
    if (quest.type === QuestType.MAIN_DAILY) {
      await this.characters.registerDailyCompletion(userId);
    }

    // ─── Schedule the next Main/Side quest for the next local 5:00 AM ──
    if (quest.type === QuestType.MAIN_DAILY) {
      character.nextMainQuestAt = nextLocalResetTime(character.timezone);
    } else if (quest.type === QuestType.SIDE) {
      character.nextSideQuestAt = nextLocalResetTime(character.timezone);
    } else if (quest.type === QuestType.VOICE_TRAINING) {
      character.nextVoiceQuestAt = nextLocalResetTime(character.timezone);
    }
    await this.characters.saveCharacter(character);

    await this.chronicles.logEvent(
      userId, 
      ChronicleType.QUEST,
      'Quest Completed', 
      `Completed ${quest.title}`, 
      { questId: quest.id }
    );
    await this.chronicles.checkStoryUnlocks(userId, character.disciplineScore);

    return entry;
  }

  /** Generates the first daily quest automatically on account creation */
  async generateFirstDailyQuest(userId: string): Promise<QuestProgress> {
    const quest = await this.quests.save(
      this.quests.create({
        title: 'Daily Preparation',
        description: 'Warm-up: 5min\nMain Exercise: 10 Push-ups\nOptional Bonus: 10 Sit-ups',
        type: QuestType.MAIN_DAILY,
        difficulty: QuestDifficulty.EASY,
        estimatedTime: 10,
        goal: 'Complete Daily Workout',
        goalValue: 1,
        xpReward: 500,
        goldReward: 50,
        attributeReward: { strength: 1 },
      })
    );
    return this.accept(userId, quest.id);
  }
}