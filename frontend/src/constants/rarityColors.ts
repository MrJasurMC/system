/** Single source of truth for rarity → color, used by ProceduralIcon call sites
 * across Achievements, Inventory, Exchange, Boss, and the unlock toast — these
 * used to each hardcode their own partial copy of this map. */
export const RARITY_COLOR: Record<string, string> = {
  common: '#8a94a6',
  uncommon: '#34d399',
  rare: '#3fa9f5',
  epic: '#a855f7',
  legendary: '#eab308',
  mythic: '#ef4444',
  celestial: '#f0f9ff',
};
