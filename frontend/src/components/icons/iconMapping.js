
const KNOWN_CATEGORIES = new Set(['weapon-knife', 'weapon-sword', 'weapon-blunt', 'weapon-bow', 'weapon-staff', 'item-entertainment', 'item-food', 'item-recovery', 'item-lifestyle', 'item-premium', 'ach-quests', 'ach-streak', 'ach-level', 'ach-boss', 'ach-combo', 'ach-secret']);

/** Non-weapon item categories (item.entity.ts ItemCategory) → glyph, used as a fallback
 * when `item.icon` isn't already a recognized category key (e.g. legacy/emoji data). */
const ITEM_CATEGORY_ICON = {
  entertainment: 'item-entertainment',
  food: 'item-food',
  recovery: 'item-recovery',
  lifestyle: 'item-lifestyle',
  premium: 'item-premium'
};

/**
 * Resolves an item's icon to a render-able category. The seed scripts now
 * write category keys directly into `item.icon` (e.g. "weapon-sword")
 * instead of emoji, so this is normally a passthrough — the fallback only
 * matters for old rows seeded before this change.
 */
export function resolveItemIconCategory(item) {
  if (item.icon && KNOWN_CATEGORIES.has(item.icon)) return item.icon;
  if (item.type === 'weapon') return 'weapon-sword';
  return ITEM_CATEGORY_ICON[item.category ?? ''] ?? 'item-lifestyle';
}

/** Same idea for achievements — `achievement.icon` is now a category key; fall back to key-prefix. */
export function resolveAchievementIconCategory(achievement) {
  if (achievement.icon && KNOWN_CATEGORIES.has(achievement.icon)) return achievement.icon;
  const key = achievement.key ?? '';
  if (key.startsWith('quests_')) return 'ach-quests';
  if (key.startsWith('streak_')) return 'ach-streak';
  if (key.startsWith('level_')) return 'ach-level';
  if (key.startsWith('boss_')) return 'ach-boss';
  if (key.startsWith('combo_')) return 'ach-combo';
  if (key.startsWith('secret_')) return 'ach-secret';
  return 'ach-quests';
}