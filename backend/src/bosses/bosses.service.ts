import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WorldBoss, BossTier } from './world-boss.entity';
import { BossDamage } from './boss-damage.entity';
import { BOSS_CATALOG, TIER_CONFIG } from './boss-catalog';
import { CharactersService } from '@/characters/characters.service';
import { InventoryService } from '@/inventory/inventory.service';

import { EventsGateway } from '@/realtime/events.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/notifications/notification.entity';
import { AchievementsService } from '@/achievements/achievements.service';

@Injectable()
export class BossesService implements OnModuleInit {
  private readonly logger = new Logger(BossesService.name);

  constructor(
    @InjectRepository(WorldBoss) private readonly bosses: Repository<WorldBoss>,
    @InjectRepository(BossDamage) private readonly bossDamage: Repository<BossDamage>,
    private readonly characters: CharactersService,
    private readonly inventory: InventoryService,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly achievements: AchievementsService,
  ) {}

  /**
   * On boot, make sure there's always a boss to fight — previously the only
   * thing that ever created one was the Sunday 06:00 cron, so a fresh DB (or
   * one where the boss window lapsed) just showed nothing until the next
   * Sunday. This spawns one immediately if none is currently active.
   */
  async onModuleInit() {
    const active = await this.bosses.findOne({ where: { isActive: true } });
    if (!active && this.isWithinBossWindow(new Date())) {
      this.logger.log('Within weekend boss window with no active World Boss on startup — spawning one now.');
      await this.spawnWeeklyBoss();
    }
  }

  /** Boss window is Saturday & Sunday, 05:00–21:00 (5:00 AM–9:00 PM). */
  private static readonly BOSS_START_HOUR = 5;
  private static readonly BOSS_END_HOUR = 21;

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private isWithinBossWindow(date: Date): boolean {
    if (!this.isWeekend(date)) return false;
    const hour = date.getHours();
    return hour >= BossesService.BOSS_START_HOUR && hour < BossesService.BOSS_END_HOUR;
  }

  /**
   * Returns the next time a boss will spawn: the next Saturday or Sunday at
   * 05:00 after `from`.
   */
  private nextSpawnTime(from: Date): Date {
    const next = new Date(from);
    next.setHours(BossesService.BOSS_START_HOUR, 0, 0, 0);
    // Walk forward day by day until we land on a weekend day at/after `from`.
    while (!this.isWeekend(next) || next <= from) {
      next.setDate(next.getDate() + 1);
      next.setHours(BossesService.BOSS_START_HOUR, 0, 0, 0);
    }
    return next;
  }

  /**
   * Which tier is in play for a given week. Common bosses dominate early
   * and stay frequent; higher tiers phase in gradually and immortal stays
   * rare — this is a curve, not a strict cycle, so it doesn't feel like a
   * metronome. Every 10th week is guaranteed Immortal as a milestone fight.
   */
  private pickTierForWeek(weekNumber: number): BossTier {
    // Weighted random, ramping with week number — but higher tiers are also
    // hard-gated by week so they can't roll at all until players have had
    // time to progress. Previously Mythic/Immortal always had a small
    // nonzero weight even in week 1; now their weight is forced to 0 below
    // the gate, so the earliest a tier can appear is the week listed here:
    //   Elite      -> week 3+
    //   Legendary  -> week 6+
    //   Mythic     -> week 10+
    //   Immortal   -> week 15+
    const rampFactor = Math.min(weekNumber / 20, 1); // 0 → 1 over ~20 weeks
    const gate = (minWeek: number, weight: number) => (weekNumber >= minWeek ? weight : 0);
    const weights: [BossTier, number][] = [
      [BossTier.COMMON, 60 - 30 * rampFactor],
      [BossTier.ELITE, gate(3, 25 + 5 * rampFactor)],
      [BossTier.LEGENDARY, gate(6, 10 + 10 * rampFactor)],
      [BossTier.MYTHIC, gate(10, 4 + 8 * rampFactor)],
      [BossTier.IMMORTAL, gate(15, 1 + 7 * rampFactor)],
    ];
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [tier, weight] of weights) {
      if (weight <= 0) continue;
      if (roll < weight) return tier;
      roll -= weight;
    }
    return BossTier.COMMON;
  }

  /**
   * Deactivates the current World Boss at the end of the daily window
   * (9:00 PM) on both Saturday and Sunday. Without this, a boss spawned at
   * 5am would otherwise stay `isActive` (and biteable) all night — the
   * 9pm cutoff is enforced here, and `endDate` is also set on the boss
   * itself so `submitDamage` rejects hits past the window even if this
   * cron is briefly late.
   */
  @Cron('0 21 * * 6,0')
  async closeBossWindow() {
    const active = await this.bosses.findOne({ where: { isActive: true } });
    if (!active) return;
    active.isActive = false;
    await this.bosses.save(active);
    this.logger.log(`Boss window closed (9:00 PM) — deactivated ${active.name}.`);
  }

  /**
   * Spawns a new World Boss at 5:00 AM every Saturday and Sunday. Each
   * day's boss is only fightable until 9:00 PM (see `closeBossWindow` and
   * `endDate` below) — outside 5am-9pm on Sat/Sun, no boss is active.
   */
  @Cron('0 5 * * 6,0')
  async spawnWeeklyBoss() {
    this.logger.log('Spawning new weekly World Boss...');

    // Deactivate previous boss
    await this.bosses.update({ isActive: true }, { isActive: false });

    // Determine week number
    const previousBoss = await this.bosses.findOne({
      where: {},
      order: { weekNumber: 'DESC' },
    });
    const weekNumber = previousBoss ? previousBoss.weekNumber + 1 : 1;

    // Base HP curve (pre-tier-scaling): starter weeks ramp gently, then
    // compounds ~30%/week so the base fight keeps growing even within a tier.
    const starterTiers = [1000, 1500, 2000, 3000, 5000];
    let baseHp = 1000;
    if (weekNumber <= starterTiers.length) {
      baseHp = starterTiers[weekNumber - 1];
    } else {
      const hpMultiplier = Math.pow(1.3, weekNumber - starterTiers.length);
      baseHp = Math.floor(1000 * hpMultiplier);
    }

    const tier = this.pickTierForWeek(weekNumber);
    const tierConfig = TIER_CONFIG[tier];
    const maxHp = Math.floor(baseHp * tierConfig.hpMultiplier);

    // Pick a name from this tier's pool, avoiding an immediate repeat of
    // last week's boss so the same name can't show up back to back.
    const pool = BOSS_CATALOG[tier];
    const candidates = previousBoss && previousBoss.tier === tier
      ? pool.filter((b) => b.name !== previousBoss.name)
      : pool;
    const chosen = (candidates.length > 0 ? candidates : pool)[Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : pool.length))];

    const startDate = new Date();
    const endDate = new Date(startDate);
    // Active only until 9:00 PM the same day — the window is 5am-9pm on
    // whichever weekend day this spawn happened (Saturday or Sunday),
    // matching closeBossWindow's cron.
    endDate.setHours(BossesService.BOSS_END_HOUR, 0, 0, 0);

    const xpReward = Math.floor(maxHp * tierConfig.rewardMultiplier);
    const goldReward = Math.max(1, Math.floor((maxHp / 10) * tierConfig.rewardMultiplier));

    await this.bosses.save(
      this.bosses.create({
        name: chosen.name,
        lore: chosen.lore,
        tier,
        requirements: { minLevel: Math.max(tierConfig.minLevel, Math.min(weekNumber * 2, 50)) },
        rewards: { xp: xpReward, gold: goldReward },
        hp: maxHp,
        maxHp,
        weekNumber,
        startDate,
        endDate,
        isActive: true,
      })
    );

    this.logger.log(`World Boss [${tier.toUpperCase()}] ${chosen.name} spawned with ${maxHp} HP.`);
  }

  async getActiveBoss(): Promise<WorldBoss> {
    const boss = await this.bosses.findOne({ where: { isActive: true } });
    if (!boss) throw new NotFoundException('No active World Boss found.');
    return boss;
  }

  /**
   * GET /bosses/status — used by the frontend instead of /active so it can
   * show a "Boss returns in Xh Ym" countdown on weekdays rather than
   * treating a 404 as a broken page (that's what the old flow did: no boss
   * = raw error box, which reads as a site bug rather than "check back this
   * weekend").
   */
  async getStatus(): Promise<
    | { active: true; boss: WorldBoss }
    | { active: false; nextSpawnAt: string }
  > {
    const boss = await this.bosses.findOne({ where: { isActive: true } });
    if (boss) return { active: true, boss };
    return { active: false, nextSpawnAt: this.nextSpawnTime(new Date()).toISOString() };
  }

  async submitDamage(
    userId: string,
    bossId: string,
    exerciseType: string,
    amount: number,
    weaponId?: string,
  ): Promise<WorldBoss> {
    const boss = await this.bosses.findOne({ where: { id: bossId, isActive: true } });
    if (!boss) throw new NotFoundException('Boss is not active.');
    if (new Date() > boss.endDate) {
      throw new BadRequestException('Boss event has ended.');
    }

    // The spawn logic computes requirements.minLevel but nothing was ever
    // reading it back — meaning an Immortal-tier boss (minLevel 50+) could
    // be attacked by a fresh level 1 character with zero pushback. Enforce
    // it here: contribution is blocked below the boss's level requirement.
    const minLevel = boss.requirements?.minLevel ?? 1;
    const character = await this.characters.getByUserId(userId);
    if (character.level < minLevel) {
      throw new BadRequestException(
        `This boss requires level ${minLevel}+ to fight. You're level ${character.level} — keep training.`,
      );
    }

    // §7 audit Fix #2: never trust client `amount` as-is. The DTO already
    // enforces 1–500, but we clamp again here so this method is safe even if
    // called from somewhere that bypasses the controller's ValidationPipe.
    const safeAmount = Math.max(1, Math.min(Math.trunc(amount), 500));

    // Damage mapping
    let damagePerRep = 0;
    switch (exerciseType.toLowerCase()) {
      case 'pushup': damagePerRep = 10; break;
      case 'squat': damagePerRep = 8; break;
      case 'pullup': damagePerRep = 20; break;
      case 'plank': damagePerRep = 1; break; // per second
      case 'running': damagePerRep = 5; break; // per 100m
      default: damagePerRep = 5; break;
    }

    // Damage is always computed server-side from the validated/clamped amount
    // and the fixed per-exercise rate above — the client can never supply a
    // damage total directly. If the player picked a specific weapon for this
    // attack (the "choose weapon" flow), that weapon's bonus is used and one
    // use is consumed from it. Otherwise fall back to whatever's globally
    // equipped, unconsumed (bare-hands / non-durability path).
    let weaponBonus = 0;
    let weaponBroke = false;
    let weaponName: string | undefined;
    if (weaponId) {
      const result = await this.inventory.consumeDurability(userId, weaponId);
      weaponBonus = result.attackBonus;
      weaponBroke = result.broke;
      weaponName = result.name;
    } else {
      weaponBonus = await this.inventory.getEquippedWeaponBonus(userId);
    }

    const damageDealt = safeAmount * (damagePerRep + weaponBonus);

    await this.bossDamage.save(
      this.bossDamage.create({
        userId,
        bossId,
        exerciseType,
        amount: safeAmount,
        damageDealt,
      })
    );

    // Reduce HP
    boss.hp = Math.max(0, Number(boss.hp) - damageDealt);
    await this.bosses.save(boss);

    // "You showed up" achievement — fires on any damage submission, not just
    // kills, since participation alone is the point of this one.
    await this.achievements.bumpProgressByKey(userId, 'boss_participate_1', 1, 1);
    await this.achievements.bumpProgressByKey(userId, 'boss_participate_10', 1, 10);
    await this.achievements.bumpProgressByKey(userId, 'boss_participate_50', 1, 50);

    if (weaponBroke && weaponName) {
      this.events.emitToUser(userId, 'item:broke', { name: weaponName });
      await this.notifications.create(userId, {
        type: NotificationType.SYSTEM,
        title: 'Weapon Destroyed',
        message: `Your ${weaponName} shattered after that strike. Time for a new one.`,
      });
      await this.achievements.bumpProgressByKey(userId, 'weapon_break_1', 1, 1);
      await this.achievements.bumpProgressByKey(userId, 'weapon_break_5', 1, 5);
    }

    // If killed, trigger rewards logic
    if (boss.hp === 0) {
      boss.isActive = false;
      await this.bosses.save(boss);
      this.logger.log(`World Boss ${boss.name} defeated! Distributing rewards...`);
      
      const participants = await this.bossDamage.createQueryBuilder('damage')
        .select('damage.userId')
        .where('damage.bossId = :bossId', { bossId: boss.id })
        .groupBy('damage.userId')
        .getRawMany();
        
      for (const p of participants) {
        await this.characters.incrementBossesDefeated(p.damage_userId);
        if (boss.rewards) {
          if (boss.rewards.xp > 0) {
            await this.characters.grantExp(p.damage_userId, boss.rewards.xp, `boss:${boss.id}`);
          }
          if (boss.rewards.gold > 0) {
            await this.characters.addGold(p.damage_userId, boss.rewards.gold);
          }
          if (Array.isArray(boss.rewards.itemIds)) {
            for (const itemId of boss.rewards.itemIds) {
              try {
                await this.inventory.grant(p.damage_userId, itemId, 1);
              } catch (err) {
                this.logger.warn(
                  `Failed to grant item ${itemId} to user ${p.damage_userId} for defeating boss ${boss.id}: ${err instanceof Error ? err.message : err}`,
                );
              }
            }
          }
          
          await this.notifications.create(p.damage_userId, {
            type: NotificationType.ACHIEVEMENT,
            title: `Defeated ${boss.name}!`,
            message: `You helped defeat the World Boss! Rewards: ${boss.rewards.xp} XP, ${boss.rewards.gold} Gold.`,
            data: { bossId: boss.id },
          });

          this.events.emitToUser(p.damage_userId, 'boss:defeated', {
            bossName: boss.name,
            xpReward: boss.rewards.xp,
            goldReward: boss.rewards.gold,
          });

          // Defeat-count achievements — 3 tiers, each keyed independently;
          // bumpProgressByKey is a no-op once a given tier is already
          // unlocked, so it's safe to bump all three on every kill.
          await this.achievements.bumpProgressByKey(p.damage_userId, 'boss_defeat_1', 1, 1);
          await this.achievements.bumpProgressByKey(p.damage_userId, 'boss_defeat_5', 1, 5);
          await this.achievements.bumpProgressByKey(p.damage_userId, 'boss_defeat_20', 1, 20);
        }
      }
    }

    return boss;
  }
}
