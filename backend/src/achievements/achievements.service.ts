import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { EventsGateway } from '@/realtime/events.gateway';
import { InventoryService } from '@/inventory/inventory.service';
import { CharactersService } from '@/characters/characters.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement) private readonly achievements: Repository<Achievement>,
    @InjectRepository(UserAchievement) private readonly userAchievements: Repository<UserAchievement>,
    private readonly events: EventsGateway,
    private readonly inventory: InventoryService,
    private readonly characters: CharactersService,
  ) {}

  findAll(): Promise<Achievement[]> {
    return this.achievements.find({ where: { hidden: false } });
  }

  findForUser(userId: string): Promise<UserAchievement[]> {
    return this.userAchievements.find({ where: { userId }, relations: ['achievement'] });
  }

  /** Delta-style bump by stable key instead of a raw achievement UUID — used for count-up events (quests claimed, bosses defeated). Silently no-ops if the key isn't seeded, so callers never need a try/catch just to stay safe against an incomplete seed. */
  async bumpProgressByKey(userId: string, key: string, delta: number, goal: number) {
    const achievement = await this.achievements.findOne({ where: { key } });
    if (!achievement) return;
    return this.bumpProgress(userId, achievement.id, delta, goal);
  }

  /**
   * Threshold-style setter by stable key — used for gauge values that are
   * already tracked elsewhere (streak length, character level) rather than
   * counted here. Sets progress to `currentValue` outright (never lets it
   * regress) instead of accumulating a delta, since the caller already knows
   * the real current value and re-adding deltas would double-count.
   */
  async setThresholdByKey(userId: string, key: string, currentValue: number, goal: number) {
    const achievement = await this.achievements.findOne({ where: { key } });
    if (!achievement) return;

    let entry = await this.userAchievements.findOne({ where: { userId, achievementId: achievement.id } });
    if (entry?.unlocked) return entry;
    if (!entry) {
      entry = this.userAchievements.create({ userId, achievementId: achievement.id, progress: 0, unlocked: false });
    }

    entry.progress = Math.max(entry.progress, currentValue);
    if (entry.progress >= goal) {
      entry.unlocked = true;
      entry.unlockedAt = new Date();
      await this.grantRewardsAndNotify(userId, achievement);
    }
    return this.userAchievements.save(entry);
  }

  private async grantRewardsAndNotify(userId: string, achievement: Achievement) {
    if (achievement.rewards) {
      if (achievement.rewards.xp > 0) {
        await this.characters.grantExp(userId, achievement.rewards.xp, `achievement:${achievement.id}`);
      }
      if (achievement.rewards.gold > 0) {
        await this.characters.addGold(userId, achievement.rewards.gold);
      }
      if (Array.isArray(achievement.rewards.itemIds)) {
        for (const itemId of achievement.rewards.itemIds) {
          try {
            await this.inventory.grant(userId, itemId, 1);
          } catch (err) {
            this.logger.warn(
              `Failed to grant item ${itemId} to user ${userId} for achievement ${achievement.id}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
      }
    }

    this.events.emitToUser(userId, 'achievement:unlocked', {
      achievementId: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
    });
  }

  /** Bumps progress and unlocks + fires achievement:unlocked (§6) once the goal is met. */
  async bumpProgress(userId: string, achievementId: string, delta: number, goal: number) {
    const achievement = await this.achievements.findOne({ where: { id: achievementId } });
    if (!achievement) throw new NotFoundException('Achievement not found.');

    let entry = await this.userAchievements.findOne({ where: { userId, achievementId } });
    if (!entry) {
      entry = this.userAchievements.create({ userId, achievementId, progress: 0, unlocked: false });
    }
    if (entry.unlocked) return entry;

    entry.progress += delta;
    if (entry.progress >= goal) {
      entry.unlocked = true;
      entry.unlockedAt = new Date();
      await this.grantRewardsAndNotify(userId, achievement);
    }
    return this.userAchievements.save(entry);
  }
}
