import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from './character.entity';
import { Attributes } from './attributes.entity';
import { applyExp, rankForLevel } from './leveling';
import { AllocateAttributesDto, CreateCharacterDto } from './dto/character.dto';
import { EventsGateway } from '@/realtime/events.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/notifications/notification.entity';
import { ChroniclesService } from '@/chronicles/chronicles.service';
import { ChronicleType } from '@/chronicles/chronicle-entry.entity';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private readonly characters: Repository<Character>,
    @InjectRepository(Attributes) private readonly attributes: Repository<Attributes>,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly chronicles: ChroniclesService,
  ) {}

  async saveCharacter(character: Character): Promise<Character> {
    return this.characters.save(character);
  }

  /** Creates the caller's one-and-only character. Fails if they already have one. */
  async createForUser(userId: string, dto: CreateCharacterDto): Promise<Character> {
    const existing = await this.characters.findOne({ where: { userId } });
    if (existing) {
      throw new BadRequestException('You already have a character.');
    }

    const character = this.characters.create({
      userId,
      name: dto.name,
      class: dto.class,
      attributes: this.attributes.create({}),
    });
    return this.characters.save(character);
  }

  /** Sets bodyweight (kg) — drives the Side quest's daily water/calorie targets. */
  async setWeight(userId: string, weightKg: number): Promise<Character> {
    const character = await this.getByUserId(userId);
    character.weightKg = weightKg;
    return this.saveCharacter(character);
  }

  /** Sets bodyweight (kg) + age (years) together — drives the Side quest's daily water/calorie targets. */
  async setNutrition(userId: string, weightKg: number, ageYears: number): Promise<Character> {
    const character = await this.getByUserId(userId);
    character.weightKg = weightKg;
    character.ageYears = ageYears;
    return this.saveCharacter(character);
  }

  /** Sets the region/timezone used to compute the 5:00 AM daily quest reset. */
  async setTimezone(userId: string, timezone: string): Promise<Character> {
    // Must be a real IANA zone — nextLocalResetTime() (quest reset scheduling)
    // feeds this straight into Intl.DateTimeFormat, which throws a RangeError
    // on anything invalid. That throw used to happen later, deep inside the
    // quest self-heal on GET /quests/mine, turning a bad Settings value into
    // a 500 on every single page load instead of a clean 400 here.
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      throw new BadRequestException(`"${timezone}" is not a valid IANA timezone (e.g. "Asia/Tashkent").`);
    }
    const character = await this.getByUserId(userId);
    character.timezone = timezone;
    return this.saveCharacter(character);
  }

  async getByUserId(userId: string): Promise<Character> {
    const character = await this.characters.findOne({
      where: { userId },
      relations: ['attributes', 'skills'],
    });
    if (!character) throw new NotFoundException('Character not found.');
    return character;
  }

  /** Central XP entrypoint — called by Quest/Workout services on completion (§9). */
  async grantExp(userId: string, amount: number, source?: string): Promise<Character> {
    const character = await this.getByUserId(userId);

    const result = applyExp(
      { level: character.level, exp: character.exp, expToNextLevel: character.expToNextLevel },
      amount,
    );

    character.level = result.level;
    character.exp = result.exp;
    character.expToNextLevel = result.expToNextLevel;
    await this.characters.save(character);

    if (result.leveledUp) {
      await this.attributes.increment(
        { characterId: character.id },
        'unallocatedPoints',
        result.unallocatedPointsGained,
      );

      // §6 WebSocket event + §5 notifications table, so the moment survives
      // even if the client is offline when it happens.
      const previousLevel = character.level - result.levelsGained;
      const previousRank = rankForLevel(previousLevel);
      const newRank = rankForLevel(character.level);

      this.events.emitToUser(userId, 'level:up', {
        level: character.level,
        previousLevel,
        levelsGained: result.levelsGained,
        xpGained: amount,
        unallocatedPointsGained: result.unallocatedPointsGained,
        rank: newRank,
        rankChanged: newRank !== previousRank,
        source,
      });
      if (newRank !== previousRank) {
        this.events.emitToUser(userId, 'rank:ceremony', {
          level: character.level,
          title: `Promotion to ${newRank}`,
          rank: newRank,
        });
      }
      await this.notifications.create(userId, {
        type: NotificationType.LEVEL_UP,
        title: 'Level Up!',
        message: `You reached level ${character.level}!`,
        data: { level: character.level, source },
      });
      await this.chronicles.logEvent(
        userId,
        ChronicleType.PROMOTION,
        'Rank Promotion',
        `Reached Level ${character.level}`,
        { level: character.level }
      );
    }

    return character;
  }

  /**
   * Advances the daily streak the first time a MAIN_DAILY quest is claimed on a
   * given calendar day. Same-day repeats are no-ops; a gap of more than one day
   * resets the streak to 1 instead of incrementing it.
   */
  async registerDailyCompletion(userId: string): Promise<Character> {
    const character = await this.getByUserId(userId);
    const today = new Date().toISOString().slice(0, 10);

    if (character.lastStreakDate === today) {
      return character; // already counted today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    character.currentStreak =
      character.lastStreakDate === yesterdayStr ? character.currentStreak + 1 : 1;
    character.longestStreak = Math.max(character.longestStreak, character.currentStreak);
    character.lastStreakDate = today;

    await this.characters.save(character);

    this.events.emitToUser(userId, 'streak:update', {
      currentStreak: character.currentStreak,
      longestStreak: character.longestStreak,
    });

    const milestone = [3, 7, 14, 30, 100, 365].includes(character.currentStreak);
    if (milestone) {
      await this.notifications.create(userId, {
        type: NotificationType.LEVEL_UP,
        title: `${character.currentStreak}-Day Streak!`,
        message: `You've stayed consistent for ${character.currentStreak} days in a row.`,
        data: { streak: character.currentStreak },
      });
    }

    return character;
  }

  /** Called when a MAIN_DAILY quest expires unclaimed — breaks the streak. */
  async breakStreak(userId: string): Promise<void> {
    const character = await this.getByUserId(userId);
    if (character.currentStreak === 0) return;
    character.currentStreak = 0;
    await this.characters.save(character);
    this.events.emitToUser(userId, 'streak:update', {
      currentStreak: 0,
      longestStreak: character.longestStreak,
    });
  }

  /** Called on every quest claim (not just MAIN_DAILY) — advances the same-day combo counter. */
  async registerMissionCombo(userId: string): Promise<{ combo: number; isNewBest: boolean }> {
    const character = await this.getByUserId(userId);
    const today = new Date().toISOString().slice(0, 10);

    character.dailyMissionCombo =
      character.lastMissionComboDate === today ? character.dailyMissionCombo + 1 : 1;
    character.lastMissionComboDate = today;

    const isNewBest = character.dailyMissionCombo > character.bestDailyMissionCombo;
    if (isNewBest) character.bestDailyMissionCombo = character.dailyMissionCombo;

    await this.characters.save(character);
    return { combo: character.dailyMissionCombo, isNewBest };
  }

  async addGold(userId: string, amount: number): Promise<void> {
    const character = await this.getByUserId(userId);
    character.gold = (character.gold ?? 0) + amount;
    await this.characters.save(character);
  }

  async incrementQuestsCompleted(userId: string): Promise<void> {
    await this.characters.increment({ userId }, 'totalQuestsCompleted', 1);
  }

  async incrementBossesDefeated(userId: string): Promise<void> {
    await this.characters.increment({ userId }, 'totalBossesDefeated', 1);
  }

  async allocateAttributes(userId: string, dto: AllocateAttributesDto): Promise<Attributes> {
    const character = await this.getByUserId(userId);
    const attrs = character.attributes;

    const requested =
      (dto.strength ?? 0) +
      (dto.agility ?? 0) +
      (dto.endurance ?? 0) +
      (dto.speed ?? 0) +
      (dto.recovery ?? 0);

    if (requested > attrs.unallocatedPoints) {
      throw new BadRequestException('Not enough unallocated attribute points.');
    }

    attrs.strength += dto.strength ?? 0;
    attrs.agility += dto.agility ?? 0;
    attrs.endurance += dto.endurance ?? 0;
    attrs.speed += dto.speed ?? 0;
    attrs.recovery += dto.recovery ?? 0;
    attrs.unallocatedPoints -= requested;

    return this.attributes.save(attrs);
  }

  /**
   * Grants attribute bonuses from a quest reward *directly* onto the character's
   * base stats, without touching the unallocatedPoints pool.
   * This is distinct from allocateAttributes (player-driven) — quest rewards
   * are automatic and should never fail or steal from the allocation pool.
   */
  async grantAttributeReward(userId: string, reward: Record<string, number>): Promise<void> {
    const character = await this.getByUserId(userId);
    const attrs = character.attributes;

    attrs.strength    += reward['strength']    ?? 0;
    attrs.agility     += reward['agility']     ?? 0;
    attrs.endurance   += reward['endurance']   ?? 0;
    attrs.speed       += reward['speed']       ?? 0;
    attrs.recovery    += reward['recovery']    ?? 0;
    // §1 — non-physical stats added by the quest rework.
    attrs.discipline  += reward['discipline']  ?? 0;
    attrs.focus       += reward['focus']       ?? 0;
    attrs.programming += reward['programming'] ?? 0;
    attrs.knowledge   += reward['knowledge']   ?? 0;
    attrs.charisma    += reward['charisma']    ?? 0;
    attrs.finance      += reward['finance']      ?? 0;

    await this.attributes.save(attrs);
  }

  /**
   * §8 punishments — applies a light debuff from a missed/expired quest's
   * failurePenalty. Intentionally soft (percent dips to energy/focus, or a
   * broken streak bonus) rather than stat loss — the brief is explicit that
   * missing a quest should never feel like a harsh punishment.
   */
  async applyFailurePenalty(userId: string, penalty: Record<string, any>): Promise<void> {
    const character = await this.getByUserId(userId);

    if (typeof penalty.energyPercent === 'number') {
      const delta = Math.round(character.physicalEnergy * (penalty.energyPercent / 100));
      character.physicalEnergy = Math.max(0, Math.min(100, character.physicalEnergy + delta));
    }
    if (typeof penalty.focusPercent === 'number') {
      const delta = Math.round(character.mentalEnergy * (penalty.focusPercent / 100));
      character.mentalEnergy = Math.max(0, Math.min(100, character.mentalEnergy + delta));
    }
    if (penalty.breakStreak) {
      character.currentStreak = 0;
    }

    await this.characters.save(character);
  }

  /**
   * §4 energy system — decays mental/physical energy once per day, restored
   * by RECOVERY-type quest claims and sleep logging (frontend/future work).
   * Called from QuestGeneratorService's existing midnight cron rather than a
   * second cron, to keep all daily-rollover logic on one schedule.
   */
  async decayDailyEnergy(userId: string): Promise<void> {
    const character = await this.getByUserId(userId);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (character.lastEnergyDecayDate === todayStr) return;

    character.physicalEnergy = Math.max(0, character.physicalEnergy - 10);
    character.mentalEnergy = Math.max(0, character.mentalEnergy - 10);
    character.lastEnergyDecayDate = todayStr;

    await this.characters.save(character);
  }

  /** GET /api/leaderboard (§6) — top characters by level then exp. */
  async getLeaderboard(limit = 50): Promise<Pick<Character, 'id' | 'name' | 'level' | 'exp' | 'class'>[]> {
    return this.characters.find({
      select: ['id', 'name', 'level', 'exp', 'class'],
      order: { level: 'DESC', exp: 'DESC' },
      take: limit,
    });
  }
}
