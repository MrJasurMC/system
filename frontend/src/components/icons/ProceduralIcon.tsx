import React from 'react';

/**
 * Custom "texture" generator for achievements & exchange items — deterministic
 * per name, so the same item always renders the same badge, but every item
 * looks distinct (no two "Iron Sword" vs "Iron Knife" share a silhouette).
 * Mirrors the pattern already used for World Boss portraits in Boss.tsx,
 * extended to cover weapon families and achievement categories.
 */

export type IconCategory =
  | 'weapon-knife' | 'weapon-sword' | 'weapon-blunt' | 'weapon-bow' | 'weapon-staff'
  | 'item-entertainment' | 'item-food' | 'item-recovery' | 'item-lifestyle' | 'item-premium'
  | 'ach-quests' | 'ach-streak' | 'ach-level' | 'ach-boss' | 'ach-combo' | 'ach-secret';

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Shape drawn per category — kept simple line/poly art so it reads at small badge sizes. */
function CategoryGlyph({ category, color, h }: { category: IconCategory; color: string; h: number }) {
  const j = (n: number) => ((h >> n) % 10) - 5;

  switch (category) {
    case 'weapon-knife':
      return <path d={`M50,${10 + j(1)} L58,55 L50,90 L42,55 Z M42,55 L20,60 M58,55 L80,60`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case 'weapon-sword':
      return <path d={`M50,6 L56,60 L50,94 L44,60 Z M28,${58 + j(2)} L72,${58 - j(2)} M50,60 L50,94`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case 'weapon-blunt':
      return (
        <>
          <circle cx="50" cy="30" r={16 + (j(3) % 4)} fill={color} opacity="0.85" />
          <rect x="45" y="42" width="10" height="46" rx="4" fill={color} />
        </>
      );
    case 'weapon-bow':
      return <path d={`M30,10 Q${65 + j(4)},50 30,90 M30,10 L30,90`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />;
    case 'weapon-staff':
      return (
        <>
          <rect x="46" y="20" width="8" height="70" rx="3" fill={color} />
          <circle cx="50" cy="16" r={10 + (j(5) % 3)} fill="none" stroke={color} strokeWidth="4" />
        </>
      );
    case 'item-entertainment':
      return <rect x="15" y="30" width="70" height="40" rx="10" fill="none" stroke={color} strokeWidth="5" />;
    case 'item-food':
      return <path d="M25,45 Q50,20 75,45 L70,80 Q50,90 30,80 Z" fill={color} opacity="0.85" />;
    case 'item-recovery':
      return <path d={`M50,20 Q${75 + j(1)},40 50,${85 + j(2) % 5} Q${25 - j(1)},40 50,20 Z`} fill={color} opacity="0.85" />;
    case 'item-lifestyle':
      return <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke={color} strokeWidth="5" />;
    case 'item-premium':
      return <polygon points="50,8 61,38 92,38 66,57 76,88 50,68 24,88 34,57 8,38 39,38" fill={color} opacity="0.9" />;
    case 'ach-quests':
      return <path d="M20,80 L50,20 L80,80 Z" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />;
    case 'ach-streak':
      return <path d={`M50,10 Q${70 + j(1)},40 55,55 Q${75 + j(2)},60 50,90 Q${25 - j(2)},60 45,55 Q${30 - j(1)},40 50,10 Z`} fill={color} opacity="0.85" />;
    case 'ach-level':
      return (
        <>
          <circle cx="50" cy="40" r="22" fill="none" stroke={color} strokeWidth="5" />
          <polygon points="35,58 25,90 50,75 75,90 65,58" fill={color} opacity="0.85" />
        </>
      );
    case 'ach-boss':
      return <polygon points="50,10 65,40 90,45 68,65 74,90 50,75 26,90 32,65 10,45 35,40" fill={color} opacity="0.9" />;
    case 'ach-combo':
      return <path d={`M25,${30 + j(1)} Q50,10 75,${30 + j(2)} Q90,50 75,${70 - j(2)} Q50,90 25,${70 - j(1)} Q10,50 25,${30 + j(1)} Z`} fill="none" stroke={color} strokeWidth="5" />;
    case 'ach-secret':
      return <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="5" strokeDasharray="6 6" />;
    default:
      return <circle cx="50" cy="50" r="30" fill={color} opacity="0.8" />;
  }
}

export function ProceduralIcon({
  seed,
  category,
  color,
  size = 32,
}: {
  /** Unique name driving the deterministic variation (item/achievement title). */
  seed: string;
  category: IconCategory;
  /** Rarity-tier color — pass the same RARITY_COLOR value used elsewhere on the page. */
  color: string;
  size?: number;
}) {
  const h = hashSeed(seed);
  const ringOpacity = 0.2 + (h % 30) / 100;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <radialGradient id={`glow-${h}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#glow-${h})`} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="2" opacity={ringOpacity} />
      <CategoryGlyph category={category} color={color} h={h} />
    </svg>
  );
}
