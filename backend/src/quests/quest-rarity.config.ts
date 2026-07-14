import { QuestRarity } from './quest.entity';

/**
 * Single source of truth for what QuestRarity actually *does*. Until now the
 * column existed on the entity/migration but nothing ever set or read it —
 * every quest was silently 'common' with no reward difference. This file
 * wires rarity into: drop chance, reward multiplier, and expiry window.
 */
export interface RarityConfig {
  /** Base weight for weighted-random rolls. Not a percentage on its own — see baseDropRates below. */
  weight: number;
  /** Multiplier applied to a quest's base xpReward / goldReward. */
  rewardMultiplier: number;
  /** Extra hours added to the quest's expiresAt window (higher rarity = a bit more time, since the ask is bigger). */
  bonusExpiryHours: number;
}

export const RARITY_CONFIG: Record<QuestRarity, RarityConfig> = {
  [QuestRarity.COMMON]: { weight: 550, rewardMultiplier: 1.0, bonusExpiryHours: 0 },
  [QuestRarity.UNCOMMON]: { weight: 250, rewardMultiplier: 1.25, bonusExpiryHours: 1 },
  [QuestRarity.RARE]: { weight: 120, rewardMultiplier: 1.6, bonusExpiryHours: 2 },
  [QuestRarity.EPIC]: { weight: 50, rewardMultiplier: 2.2, bonusExpiryHours: 4 },
  [QuestRarity.LEGENDARY]: { weight: 25, rewardMultiplier: 3.2, bonusExpiryHours: 8 },
  [QuestRarity.MYTHIC]: { weight: 5, rewardMultiplier: 5.0, bonusExpiryHours: 12 },
};

/** Base drop rates at weight-sum 1000 — i.e. the table above IS the percentages (550 = 55.0%, 5 = 0.5%). */
export const BASE_DROP_RATE_PERCENT: Record<QuestRarity, number> = Object.fromEntries(
  Object.entries(RARITY_CONFIG).map(([rarity, cfg]) => [rarity, cfg.weight / 10]),
) as Record<QuestRarity, number>;

/**
 * Rolls a rarity using the weight table, with an optional streak-based luck
 * bump: every 5 days of streak shifts 1% of weight off COMMON onto
 * RARE/EPIC/LEGENDARY/MYTHIC, capped at 15% shifted (streak 75+). This is
 * "the more consistent you are, the better your daily quest odds get" —
 * mirrors the existing streakMultiplier reward bonus, but for rarity instead
 * of a flat XP/gold %.
 */
export function rollRarity(streak = 0): QuestRarity {
  const shiftPercent = Math.min(Math.floor(streak / 5), 15); // 0–15% of the 1000-weight pool
  const shiftWeight = shiftPercent * 10;

  const weights: Record<QuestRarity, number> = {
    [QuestRarity.COMMON]: RARITY_CONFIG[QuestRarity.COMMON].weight - shiftWeight,
    [QuestRarity.UNCOMMON]: RARITY_CONFIG[QuestRarity.UNCOMMON].weight,
    [QuestRarity.RARE]: RARITY_CONFIG[QuestRarity.RARE].weight + Math.round(shiftWeight * 0.4),
    [QuestRarity.EPIC]: RARITY_CONFIG[QuestRarity.EPIC].weight + Math.round(shiftWeight * 0.3),
    [QuestRarity.LEGENDARY]: RARITY_CONFIG[QuestRarity.LEGENDARY].weight + Math.round(shiftWeight * 0.2),
    [QuestRarity.MYTHIC]: RARITY_CONFIG[QuestRarity.MYTHIC].weight + Math.round(shiftWeight * 0.1),
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const rarity of Object.keys(weights) as QuestRarity[]) {
    roll -= weights[rarity];
    if (roll <= 0) return rarity;
  }
  return QuestRarity.COMMON; // fallback, should be unreachable
}

/** Applies a rarity's reward multiplier to a base xp/gold pair, rounding to whole numbers. */
export function applyRarityRewards(
  baseXp: number,
  baseGold: number,
  rarity: QuestRarity,
): { xpReward: number; goldReward: number } {
  const { rewardMultiplier } = RARITY_CONFIG[rarity];
  return {
    xpReward: Math.round(baseXp * rewardMultiplier),
    goldReward: Math.round(baseGold * rewardMultiplier),
  };
}
