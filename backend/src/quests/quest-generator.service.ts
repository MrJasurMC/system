import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Quest, QuestType, QuestDifficulty, QuestRarity } from './quest.entity';
import { QuestProgress, QuestStatus } from './quest-progress.entity';
import { rollRarity, applyRarityRewards } from './quest-rarity.config';
import { CharactersService } from '@/characters/characters.service';
import { User } from '@/users/user.entity';
import { nextLocalResetTime } from '@/common/timezone.util';

@Injectable()
export class QuestGeneratorService {
  private readonly logger = new Logger(QuestGeneratorService.name);

  /**
   * Per-user generation lock. `findMine()` calls generateDailyQuest() as a
   * self-heal on every page load, and the Dashboard + Quests page both fire
   * that call within moments of each other on navigation. Both requests were
   * reading "no active Daily Discipline quest yet" before either had finished
   * inserting one, so both inserted — that's the duplicate "Daily Discipline"
   * card bug. This serializes generateDailyQuest per user so a second
   * concurrent call waits for the first to finish (and see its insert)
   * before running its own duplicate check.
   */
  private readonly generationLocks = new Map<string, Promise<void>>();

  private withGenerationLock(userId: string, fn: () => Promise<void>): Promise<void> {
    const prior = this.generationLocks.get(userId) ?? Promise.resolve();
    const run = prior.then(fn, fn);
    // Swallow so one failure doesn't wedge the lock for later calls.
    this.generationLocks.set(userId, run.catch(() => undefined));
    return run;
  }

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Quest) private readonly quests: Repository<Quest>,
    @InjectRepository(QuestProgress) private readonly questProgress: Repository<QuestProgress>,
    private readonly characters: CharactersService,
  ) {}

  /**
   * Runs daily at midnight to fail expired quests and generate new daily quests.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyQuests() {
    this.logger.log('Running daily quest processing...');
    const users = await this.users.find();
    
    for (const user of users) {
      await this.evaluateFailedQuests(user.id);
      await this.characters.decayDailyEnergy(user.id);
      await this.generateDailyQuest(user.id);
    }
  }

  async evaluateFailedQuests(userId: string) {
    const expiredQuests = await this.questProgress.find({
      where: {
        userId,
        status: QuestStatus.ACCEPTED,
      },
      relations: ['quest'],
    });

    let penaltiesAppliedToday = 0;
    const MAX_DAILY_PENALTIES = 2; // §8 — cap stacking so a bad day can't cascade into a debuff spiral

    for (const entry of expiredQuests) {
      if (!entry.quest) continue; // dangling row — nothing to evaluate, skip instead of crashing
      if (entry.quest.expiresAt && entry.quest.expiresAt < new Date()) {
        entry.status = QuestStatus.FAILED;
        await this.questProgress.save(entry);

        if (entry.quest.type === QuestType.MAIN_DAILY) {
          await this.characters.breakStreak(userId);
          await this.generatePenaltyTrial(userId);
        }

        if (entry.quest.failurePenalty && penaltiesAppliedToday < MAX_DAILY_PENALTIES) {
          await this.characters.applyFailurePenalty(userId, entry.quest.failurePenalty);
          penaltiesAppliedToday += 1;
        }
      }
    }
  }

  /**
   * Mirrors QuestsService.accept() but lives here directly instead of
   * injecting QuestsService, since QuestsService needs to call back into
   * this generator (to self-heal a missing daily quest on read/claim) and
   * Nest can't resolve a two-way constructor dependency between them.
   */
  private async acceptQuest(userId: string, questId: string): Promise<QuestProgress> {
    const existing = await this.questProgress.findOne({ where: { userId, questId } });
    if (existing) return existing;
    return this.questProgress.save(
      this.questProgress.create({ userId, questId, status: QuestStatus.ACCEPTED, progress: 0 }),
    );
  }

  async generatePenaltyTrial(userId: string) {
    const character = await this.characters.getByUserId(userId);
    const level = character.level;
    
    let pushups = 20;
    let squats = 20;
    if (level >= 20) { pushups = 50; squats = 60; }
    if (level >= 50) { pushups = 100; squats = 100; }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours to complete

    const quest = await this.quests.save(
      this.quests.create({
        title: 'Penalty Trial',
        description: `The System has detected inactivity.\nComplete this to restore balance.\n\nMain Exercise: ${pushups} Push-ups\nLower Body: ${squats} Squats`,
        type: QuestType.PUNISHMENT,
        difficulty: level >= 50 ? QuestDifficulty.HARD : (level >= 20 ? QuestDifficulty.NORMAL : QuestDifficulty.EASY),
        estimatedTime: 20,
        goal: 'Complete Penalty Trial',
        goalValue: 1,
        xpReward: Math.floor(level * 50),
        goldReward: 0, // Punishments yield no gold
        expiresAt,
      })
    );

    await this.acceptQuest(userId, quest.id);
    this.logger.log(`Generated Penalty Trial for user ${userId}`);
  }

  /**
   * A pool of mission "templates" grouped by focus. Each template scales its
   * numbers off level with a cap, so missions stay demanding but never absurd.
   * `roll` picks one template per focus per day, so the mix changes daily
   * instead of repeating the same routine forever.
   */
  /**
   * PROJECT TOJI — real Pull/Push-Core/Legs split instead of hitting every
   * muscle group every day. Daily max-effort volume on the same movements
   * (esp. pull ups/chin ups) never lets those muscles recover, which trains
   * work-capacity/endurance instead of size. Splitting means each muscle
   * group gets one real max-effort day + several rest days before it's
   * loaded hard again, which is what actually drives hypertrophy.
   *
   * Schedule (0=Sun ... 6=Sat):
   *   Tue (2) — Pull day: back/arms/grip (Predator's Back + Titan Arms + Iron Grip)
   *   Thu (4) — Push/Core day: shoulders/core (Broad Shoulders + Steel Core)
   *   Sat (6) — Leg day: Monster Legs
   *   Sun (0) — Boss Day: full-body max-effort test (also the existing World
   *             Boss weekend window in bosses.service.ts — this is the
   *             training analogue of that fight)
   *   Mon/Wed/Fri — active recovery: mobility + light conditioning only, no
   *             max-effort lifting, so Tue/Thu/Sat muscles actually rebuild.
   *
   * Rep targets still climb weekly (+5/week push/squat family, +1/week
   * pull/chin, since those are much harder to add volume to) until a sane
   * cap, after which progress should come from harder variants (weighted
   * backpack, slow negatives, wider grip) rather than more reps.
   */
  /**
   * PROJECT TOJI PROTOCOL v2 — three phases instead of one static week
   * repeated forever:
   *
   *   Phase 1 "Foundation & Mass"  (programWeek 0-7)  — build the work
   *     capacity and movement quality bodyweight training requires before
   *     loading anything.
   *   Phase 2 "Load & Widen"       (programWeek 8-15) — once bodyweight
   *     reps hit a real-strength threshold, add external load (weighted
   *     backpack) so pull/push/dip progress doesn't stall at the bodyweight
   *     ceiling. Plyometrics introduced on Tue/Sat for speed.
   *   Phase 3 "Peak V-Taper"       (programWeek 16+)  — heavier load
   *     progression + full plyo/sprint block. This is the phase that turns
   *     "lean and defined" into "actually big and fast."
   *
   * Weighted load (kg) only applies once bodyweight reps clear the
   * threshold noted per-exercise — added weight before that just breaks
   * form on someone starting from malnourished/E-rank baseline.
   */
  private buildFullBodyQuest(programWeek: number, dayOfWeek: number): { lines: string[]; attributeReward: Record<string, number>; title: string; dayType: 'training' | 'boss' | 'rest' } {
    const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
    const phase: 1 | 2 | 3 = programWeek >= 16 ? 3 : programWeek >= 8 ? 2 : 1;

    const pushUps = Math.min(50 + 5 * programWeek, 150);
    const squats = Math.min(100 + 5 * programWeek, 200);
    const pullUps = Math.min(20 + 1 * programWeek, 40);
    const chinUps = Math.min(20 + 1 * programWeek, 40);

    // Weighted load added in phases 2/3, gated behind a real bodyweight
    // strength threshold rather than just "week number" — matches the
    // logbook progression rule (earn the load, don't just get handed it).
    const loadKg = phase === 1 ? 0 : Math.min(2 + (programWeek - 8) * 1, 20);
    const pullLoadNote = phase >= 2 && pullUps >= 15 ? ` (+${loadKg}kg backpack once 15 clean bodyweight reps)` : '';
    const dipPushLoadNote = phase >= 2 && pushUps >= 80 ? ` (+${loadKg}kg backpack once ${round5(pushUps * 0.6)} clean reps)` : '';
    const squatLoadNote = phase >= 2 ? ` (+${loadKg}kg backpack/bag, tempo: 3sec down, 1sec pause, explode up)` : ' (tempo: 3sec down, 1sec pause, explode up)';

    const speedBlockPull = phase >= 2 ? ['Broad Jumps — 3x5 (land soft, reset each rep)'] : [];
    const speedBlockLeg = phase >= 2 ? ['Jump Squats — 3x10 (explosive, land soft)', 'Sprint Intervals — 6x20m, walk back recovery'] : [];

    switch (dayOfWeek) {
      case 2: // Tuesday — Pull Day
        return {
          title: `Pull Day — The Predator's Back (Phase ${phase})`,
          dayType: 'training',
          lines: [
            `Slow Negative Pull Ups — 4 sets x 5 reps (up fast, 3-4 sec lower)${pullLoadNote}`,
            `Chin Ups (underhand) — 3 sets x ${Math.min(6 + Math.floor(programWeek / 2), 15)} reps, focus biceps`,
            `Towel Pull Ups — ${round5(pullUps * 0.4)} total (grip/forearm)`,
            'Dead Hang — 3 sets, hold until grip fails, beat last time',
            ...speedBlockPull,
          ],
          attributeReward: { strength: 3, endurance: 1, ...(phase >= 2 ? { speed: 1 } : {}) },
        };
      case 4: // Thursday — Push/Core Day
        return {
          title: `Push & Core Day — Shadow Soldier Shoulders (Phase ${phase})`,
          dayType: 'training',
          lines: [
            `Pike Push Ups — 3 sets x ${Math.min(8 + Math.floor(programWeek / 2), 20)} reps (hips high, main shoulder builder)`,
            `Decline Push Ups (feet elevated) — 3 sets x ${Math.min(12 + Math.floor(programWeek / 2), 25)} reps${dipPushLoadNote}`,
            'Regular Push Ups — 2 sets, max reps burnout',
            `Leg Raises (lying flat) — 3 sets x ${Math.min(15 + Math.floor(programWeek / 2), 30)} reps`,
            'Plank Hold — 3 rounds, max time each',
            'Side Plank — 3 sets x 30 sec per side (obliques)',
          ],
          attributeReward: { strength: 2, endurance: 2 },
        };
      case 6: // Saturday — Leg Day
        return {
          title: `Leg Day — Monster Legs (Phase ${phase})`,
          dayType: 'training',
          lines: [
            `Tempo Squats — 3 sets x ${Math.min(12 + Math.floor(programWeek / 2), 25)} reps${squatLoadNote}`,
            `Bulgarian Split Squats — 3 sets x ${Math.min(10 + Math.floor(programWeek / 2), 20)} reps per leg, slow`,
            `Calf Raises — 4 sets x ${Math.min(20 + Math.floor(programWeek / 2), 35)} reps, 2 sec hold at top`,
            ...speedBlockLeg,
          ],
          attributeReward: { strength: 2, speed: phase >= 2 ? 2 : 1 },
        };
      case 0: // Sunday — Boss Day
        return {
          title: `BOSS DAY — Full Body Trial (Phase ${phase})`,
          dayType: 'boss',
          lines: [
            `Decline Push-ups (feet elevated) — 3 sets x ${round5(pushUps * 0.2)} reps`,
            `Towel Pull-ups — 3 sets x ${round5(pullUps * 0.25)} reps`,
            `Bulgarian Split Squats — 3 sets x 12 reps per leg`,
            'Plank Hold — 2 sets, max time',
            `Pull Ups — max effort set, record it (target: ${pullUps})`,
          ],
          attributeReward: { strength: 3, endurance: 2, agility: 1 },
        };
      case 5: // Friday — Rest & Bulk (calorie loading, explicit no-training day before leg day)
        return {
          title: 'Rest & Bulk — Calorie Loading',
          dayType: 'rest',
          lines: [
            'No training today — 100% focus on eating',
            'Extra meat, rice, and your Hunter Shake to prep for tomorrow\'s Leg Day',
            'Hit your calorie target from the Monarch\'s Fuel daily quest',
          ],
          attributeReward: { endurance: 1 },
        };
      default: // Mon/Wed — Active Recovery
        return {
          title: 'Active Recovery — System Recharge',
          dayType: 'rest',
          lines: [
            'Light Walk — 20 min, easy pace',
            'Full Body Stretch — 15 min (shoulders, chest, hips)',
            "No max-effort lifting today — this is what lets Tue/Thu/Sat's muscle actually rebuild",
          ],
          attributeReward: { endurance: 1 },
        };
    }
  }

  /**
   * Side quest pool — the long-term goal pillars from the program (V-Taper,
   * grip/shoulders, speed/explosiveness, stamina/endurance), rotated one at
   * a time. This is the ONLY other quest type besides the Main workout —
   * everything else (Daily Discipline habit list, Steel Core/Predator's
   * Back/etc pillar chains, story quests) has been retired.
   */
  private readonly SIDE_QUEST_POOL: { title: string; goal: string; lines: string[]; attributeReward: Record<string, number> }[] = [
    {
      title: 'Massive V-Taper',
      goal: 'Widen the back, taper the waist — the core Toji silhouette',
      lines: [
        'Wide Pull Ups — 4 sets to near-failure (target: 12+ reps by month 3)',
        'Scapular Pulls on Bar — 4x12 (dead hang shrugs, builds the lat "turn on" needed for wide-grip work)',
        'Dead Hangs — 4 rounds, max time (target: 90 sec by month 3)',
      ],
      attributeReward: { strength: 1, agility: 1 },
    },
    {
      title: 'Wide Shoulders',
      goal: 'Build 3D deltoids for the frame, not just the back',
      lines: [
        'Pike Push Ups — 4x10, feet elevated as it gets easy (target: 4x15 by month 4)',
        'Handstand Hold Practice — 4 rounds against a wall (target: 45 sec by month 6)',
        'Wide Push Ups — 3x12',
      ],
      attributeReward: { strength: 1, endurance: 1 },
    },
    {
      title: 'Huge Forearms',
      goal: 'Grip and forearm mass — the detail that sells the whole physique',
      lines: [
        'Towel Hangs — 3 rounds max time (target: 60 sec by month 4)',
        'Towel Pull Ups — 3 sets (target: 5 clean reps by month 6)',
        'Fat-Grip Dead Hang — 3 rounds, 30 sec (use a thick branch/rolled towel on the bar if available)',
      ],
      attributeReward: { strength: 2 },
    },
    {
      title: 'Big Arms',
      goal: 'Biceps and triceps size within a pull-bar-only program',
      lines: [
        'Chin Ups — 4 sets, close grip (target: 20 reps by month 6 — you\'re already at 15)',
        'Diamond Push Ups — 4x10 (target: 4x20 by month 6)',
        'Slow-Negative Chin Ups — 3 sets, 5 sec descent (time-under-tension drives arm growth without weights)',
      ],
      attributeReward: { strength: 2 },
    },
    {
      title: 'Muscular Body',
      goal: 'Overall mass — this is the one that needs food more than reps',
      lines: [
        'Full Body Circuit — Pull Ups, Push Ups, Squats, Plank, 3 rounds no rest',
        'Progressive Overload Check — add 1 rep to your hardest set vs last week',
        'Eat at today\'s calorie target (see Side Quest nutrition line below) — mass is built in the kitchen, not just the bar',
      ],
      attributeReward: { strength: 1, endurance: 1 },
    },
    {
      title: 'Real Strength',
      goal: 'Strength-to-bodyweight ratio — why you can already do 10 pull-ups at 40kg',
      lines: [
        'Pull Ups — max effort set, record the number (you\'re at 10 — target: 20 by month 6)',
        'L-Sit Progressions — tuck hold, 4 rounds (target: full L-sit 10 sec by month 9)',
        'Floor Prone Angel — 3 rounds, max time (front-lever prep: lie face down, lift straight arms/chest off floor)',
        'Elbow Lever — 3 attempts, max hold (balance on forearms, body straight, feet off ground)',
        'Weighted Backpack Pull Ups — once bodyweight pull ups exceed 15 clean reps, add books to a backpack',
      ],
      attributeReward: { strength: 3 },
    },
    {
      title: 'Speed and Athleticism',
      goal: 'Explosive power — Toji moves like a predator, not a statue',
      lines: [
        'Dynamic Warm-Up — 10 min, mandatory (plyo is high-impact — never skip this)',
        'Sprints — 6x full effort, walk-back recovery until fully rested',
        'Jump Squats — 4x5 max explosive effort, rest 60-90 sec between (this builds actual speed — tired jumps make you slower)',
        'Broad Jumps — 4x5, reset and rest fully each rep, focus on landing control',
        'BURNOUT FINISHER — Jump Squats to failure, 1 set, no rest, all-out (this is where the pain lives — do it after the explosive work, not instead of it)',
        'BURNOUT FINISHER — Bodyweight Squats x100, break as needed, don\'t stop until done',
      ],
      attributeReward: { speed: 2, endurance: 1 },
    },
    {
      title: 'Stamina and Endurance',
      goal: 'Work capacity — so every other quest gets easier over time',
      lines: [
        'Interval Sprints — 8 rounds of 30 sec hard effort / 60 sec walk (builds stamina + speed together, beats plain jogging)',
        'Bulgarian Split Squats — 3x12 per leg (rear foot elevated on any stable surface)',
        'Lunges — 4x20 total',
      ],
      attributeReward: { endurance: 2 },
    },
    {
      title: 'Visible Abs',
      goal: 'Lowest priority by design — comes from diet discipline, not extra ab work',
      lines: [
        'Leg Raises — 4x12',
        'Hanging Leg Raises — 4x10 (progress from lying Leg Raises once these feel controlled)',
        'Plank — 3x60 sec',
      ],
      attributeReward: { endurance: 1 },
    },
  ];

  /**
   * Simple beginner bulking guidance, scaled off bodyweight and age — not a
   * clinical/medical plan. weightKg defaults to 40 / ageYears defaults to 20
   * (their current weight per the program brief) if never set via Nutrition.
   *   Calories: kcal/kg baseline is ~40 (standard "hardgainer" lean-bulk
   *   starting point), nudged by age bracket — younger/still-growing bodies
   *   run a higher metabolism and need more per kg, older bodies less.
   *   Adjust up if weight isn't moving after 2 weeks, down if gaining too
   *   fast.
   *   Water: ~40ml/kg/day, floored at 2.5L so it's never unrealistically low.
   */
  private nutritionTargets(
    weightKg: number | null,
    ageYears: number | null,
  ): { calories: number; waterLiters: number } {
    const w = weightKg && weightKg > 0 ? weightKg : 40;
    const age = ageYears && ageYears > 0 ? ageYears : 20;

    let kcalPerKg: number;
    if (age < 18) kcalPerKg = 45; // still growing — higher energy need
    else if (age <= 30) kcalPerKg = 40;
    else if (age <= 50) kcalPerKg = 37;
    else kcalPerKg = 33;

    const calories = Math.round((w * kcalPerKg) / 50) * 50; // round to nearest 50 kcal
    const waterLiters = Math.max(2.5, Math.round(w * 0.04 * 10) / 10);
    return { calories, waterLiters };
  }

  /** Mirrors the rest days in buildFullBodyQuest's switch (Mon/Wed/Fri) — the
   * Side quest checks this too so it never tells the player to do a training
   * circuit on the same day the Main quest says "no training today." */
  private isRestDay(dayOfWeek: number): boolean {
    return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  }

  async generateSideQuest(userId: string) {
    const character = await this.characters.getByUserId(userId);
    if (character.nextSideQuestAt && character.nextSideQuestAt.getTime() > Date.now()) {
      return; // Not due yet — resets at the next local 5:00 AM.
    }

    const activeSide = await this.questProgress.find({
      where: [{ userId, status: QuestStatus.ACCEPTED }, { userId, status: QuestStatus.IN_PROGRESS }],
      relations: ['quest'],
    });
    if (activeSide.some((p) => p.quest?.type === QuestType.SIDE)) return;

    const totalClaimed = await this.questProgress.count({
      where: { userId, status: QuestStatus.CLAIMED },
    });
    const template = this.SIDE_QUEST_POOL[totalClaimed % this.SIDE_QUEST_POOL.length];
    const expiresAt = nextLocalResetTime(character.timezone);
    const { calories, waterLiters } = this.nutritionTargets(character.weightKg, character.ageYears);
    const isRest = this.isRestDay(new Date().getDay());
    const exerciseLines = isRest
      ? [`Rest day — no extra training today (see Main quest). ${template.title} picks back up on your next training day.`]
      : template.lines;

    const quest = await this.quests.save(
      this.quests.create({
        title: template.title,
        description: [
          ...exerciseLines.map((l) => `- ${l}`),
          `- Drink ${waterLiters}L of water today`,
          `- Eat around ${calories} kcal today (weight-gain target)`,
          '- Hunter Shake (~600 kcal, blend and drink): 50g oats + 300ml milk + 2 tbsp peanut butter + 1 banana',
        ].join('\n'),
        type: QuestType.SIDE,
        difficulty: QuestDifficulty.NORMAL,
        estimatedTime: 20,
        goal: template.goal,
        goalValue: 1,
        xpReward: 250 + character.level * 10,
        goldReward: 80 + character.level * 3,
        attributeReward: template.attributeReward,
        expiresAt,
      }),
    );
    await this.acceptQuest(userId, quest.id);
  }

  async generateDailyQuest(userId: string) {
    return this.withGenerationLock(userId, () => this.generateDailyQuestInner(userId));
  }

  private async generateDailyQuestInner(userId: string) {
    // Side quest generates independently of the Main workout quest below —
    // it used to sit after the early-return, so on any day you still had an
    // active workout quest, the side quest silently never regenerated.
    await this.generateSideQuest(userId);

    const character = await this.characters.getByUserId(userId);

    // Not due yet — Main quest resets at the next local 5:00 AM, not on
    // every page load. This is what actually shows "Next quest: tomorrow
    // 5:00 AM" client-side instead of instantly handing out a new one.
    if (character.nextMainQuestAt && character.nextMainQuestAt.getTime() > Date.now()) {
      return;
    }

    // Check if user already has an active (accepted or in-progress) daily quest
    const activeDailies = await this.questProgress.find({
      where: [
        { userId, status: QuestStatus.ACCEPTED },
        { userId, status: QuestStatus.IN_PROGRESS },
      ],
      relations: ['quest'],
    });

    const hasActiveDaily = activeDailies.some(p => p.quest?.type === QuestType.MAIN_DAILY);
    if (hasActiveDaily) {
      return; // Already has an active daily quest
    }

    const level = character.level;
    const streak = character.currentStreak ?? 0;

    // Week 1 (first 7 days) = programWeek 0, week 2 = programWeek 1, etc.
    // Drives the weekly rep-target progression in buildFullBodyQuest.
    const daysSinceStart = Math.floor((Date.now() - character.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const programWeek = Math.min(Math.floor(daysSinceStart / 7), 52); // year-long program
    const dayOfWeek = new Date().getDay(); // 0=Sun ... 6=Sat
    const { lines, attributeReward, title: dayTitle, dayType } = this.buildFullBodyQuest(programWeek, dayOfWeek);

    const rarity = rollRarity(streak);

    // Resets at the next local 5:00 AM in the character's timezone — same
    // instant for every quest type, so Main and Side always come back
    // together (§ user spec: "should come at exactly the same time").
    const expiresAt = nextLocalResetTime(character.timezone);

    // Streak bonus grows with consistency but is capped so it never dwarfs base rewards.
    const streakMultiplier = 1 + Math.min(streak * 0.02, 0.5);
    // Rest days pay out less than training/boss days — lighter load, lighter reward.
    // Boss day pays a bit more than a normal training day since it's max-effort across everything.
    const dayMultiplier = dayType === 'rest' ? 0.5 : dayType === 'boss' ? 1.2 : 1;

    const baseXp = Math.round((300 + level * 20) * streakMultiplier * dayMultiplier);
    const baseGold = Math.round((100 + level * 5) * streakMultiplier * dayMultiplier);
    const { xpReward, goldReward } = applyRarityRewards(baseXp, baseGold, rarity);

    const rarityLabel = rarity === QuestRarity.COMMON ? '' : ` [${rarity.toUpperCase()}]`;

    const quest = await this.quests.save(
      this.quests.create({
        title: `${dayTitle} — Day ${streak + 1}${rarityLabel}`,
        description: `PROJECT TOJI · Week ${programWeek + 1}\n\n${lines.map((l) => `- ${l}`).join('\n')}`,
        type: QuestType.MAIN_DAILY,
        difficulty: dayType === 'rest' ? QuestDifficulty.EASY : dayType === 'boss' || programWeek >= 13 ? QuestDifficulty.HARD : QuestDifficulty.NORMAL,
        rarity,
        estimatedTime: dayType === 'rest' ? 20 : 40,
        goal: 'Complete Daily Workout',
        goalValue: 1,
        xpReward,
        goldReward,
        attributeReward,
        expiresAt,
      })
    );

    await this.acceptQuest(userId, quest.id);
  }
}
