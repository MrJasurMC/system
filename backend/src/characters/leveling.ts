/**
 * Core leveling math (§9 RPG Module). Kept as pure functions so it's
 * trivial to unit test and reused by both the Character and Quest
 * services whenever XP is awarded.
 */
export interface LevelState {
  level: number;
  exp: number;
  expToNextLevel: number;
}

export interface LevelUpResult extends LevelState {
  leveledUp: boolean;
  levelsGained: number;
  unallocatedPointsGained: number;
}

const BASE_EXP_TO_LEVEL = 100;
const ATTRIBUTE_POINTS_PER_LEVEL = 3;

/** Single source of truth for level -> rank title, shared by the entity getter and event payloads. */
export function rankForLevel(level: number): string {
  if (level >= 100) return 'Mythic';
  if (level >= 75) return 'Legend';
  if (level >= 50) return 'Ascendant';
  if (level >= 35) return 'Champion';
  if (level >= 20) return 'Elite';
  if (level >= 10) return 'Disciple';
  if (level >= 5) return 'Novice';
  return 'Beginner';
}

/**
 * Project Limitless title ladder — the narrative label shown alongside
 * `rank` (which drives raid/leaderboard tiering). Titles gate new quest
 * categories/rarity ceilings client-side; these thresholds are the single
 * source of truth for both.
 */
export interface TitleTier {
  level: number;
  title: string;
}

export const TITLE_LADDER: TitleTier[] = [
  { level: 1, title: 'Ordinary Human' },
  { level: 5, title: 'Habit Former' },
  { level: 10, title: 'Disciplined Beginner' },
  { level: 15, title: 'Grinder' },
  { level: 25, title: 'Awakened' },
  { level: 35, title: 'Specialist' },
  { level: 50, title: 'Elite Human' },
  { level: 60, title: 'Vanguard' },
  { level: 75, title: 'Limit Breaker' },
  { level: 90, title: 'Ascendant' },
  { level: 100, title: 'Limitless Candidate' },
];

/** Highest title whose level threshold the player has reached. */
export function titleForLevel(level: number): string {
  let current = TITLE_LADDER[0].title;
  for (const tier of TITLE_LADDER) {
    if (level >= tier.level) current = tier.title;
    else break;
  }
  return current;
}

/** Linear scaling: level 1->2 needs 100 exp, level 2->3 needs 200, level 3->4 needs 300, etc. */
export function expRequiredFor(level: number): number {
  return BASE_EXP_TO_LEVEL * level;
}

/** Applies an XP gain, rolling over multiple level-ups if the gain is large. */
export function applyExp(state: LevelState, gained: number): LevelUpResult {
  let { level, exp, expToNextLevel } = state;
  exp += gained;
  let levelsGained = 0;

  while (exp >= expToNextLevel) {
    exp -= expToNextLevel;
    level += 1;
    levelsGained += 1;
    expToNextLevel = expRequiredFor(level);
  }

  return {
    level,
    exp,
    expToNextLevel,
    leveledUp: levelsGained > 0,
    levelsGained,
    unallocatedPointsGained: levelsGained * ATTRIBUTE_POINTS_PER_LEVEL,
  };
}
