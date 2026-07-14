import { BossTier } from './world-boss.entity';

export interface BossTierConfig {
  /** Multiplies the week's base HP curve. Higher tier = tankier boss. */
  hpMultiplier: number;
  /** Multiplies XP/gold rewards on top of the usual HP-derived formula. */
  rewardMultiplier: number;
  /** Minimum character level suggested to meaningfully contribute. */
  minLevel: number;
}

export const TIER_CONFIG: Record<BossTier, BossTierConfig> = {
  [BossTier.COMMON]: { hpMultiplier: 1, rewardMultiplier: 1, minLevel: 1 },
  [BossTier.ELITE]: { hpMultiplier: 1.6, rewardMultiplier: 1.5, minLevel: 10 },
  [BossTier.LEGENDARY]: { hpMultiplier: 2.4, rewardMultiplier: 2.25, minLevel: 20 },
  [BossTier.MYTHIC]: { hpMultiplier: 3.5, rewardMultiplier: 3.5, minLevel: 35 },
  [BossTier.IMMORTAL]: { hpMultiplier: 5, rewardMultiplier: 5.5, minLevel: 50 },
};

/**
 * 50 named world bosses across 5 tiers. Common bosses show up most often;
 * Immortal is the rarest and hardest — see `pickTierForWeek` in
 * bosses.service.ts for the spawn-frequency curve.
 */
export const BOSS_CATALOG: Record<BossTier, { name: string; lore: string }[]> = {
  [BossTier.COMMON]: [
    { name: 'Iron Colossus', lore: 'A towering construct of scrap and rust, slow but relentless.' },
    { name: 'Stone Beast', lore: 'Carved from the mountainside, it moves only when provoked.' },
    { name: 'Crimson Peak', lore: 'A living rockslide, always warm to the touch.' },
    { name: 'Rustbound Golem', lore: 'Held together by will and old chains.' },
    { name: 'Marsh Wraith', lore: 'A shape of fog and old grudges, drawn to laziness.' },
    { name: 'Bonefang Hound', lore: 'The first to test any hunter foolish enough to skip a rest day.' },
    { name: 'Gravel Titan', lore: 'It counts your missed reps and grows stronger for each one.' },
    { name: 'Ashen Brute', lore: 'Born from a training ground that burned down long ago.' },
    { name: 'Hollow Sentinel', lore: 'Guards nothing but old habits.' },
    { name: 'Thornback Wretch', lore: 'Every excuse you make feeds it a little more.' },
    { name: 'Clay Warden', lore: 'A soft-looking thing that hits far harder than it should.' },
    { name: 'Duskcrawler', lore: 'Comes out only when discipline slips at night.' },
    { name: 'Novice Breaker', lore: 'Every hunter fights this one first. Most underestimate it.' },
  ],
  [BossTier.ELITE]: [
    { name: 'Storm Leviathan', lore: 'A serpent of lightning that circles the weekend skies.' },
    { name: 'Void Titan', lore: 'A tear in the world shaped like a warrior.' },
    { name: 'Obsidian Reaver', lore: 'Forged in the pressure of a thousand missed mornings, now unbreakable.' },
    { name: 'Frostbound Colossus', lore: 'Slow to anger, impossible to outlast without real conditioning.' },
    { name: 'Emberclaw Drake', lore: 'A juvenile dragon that mistakes hesitation for weakness.' },
    { name: 'Wraithlord Kaelen', lore: 'A fallen champion who never skipped leg day, and never let you either.' },
    { name: 'Bloodfang Alpha', lore: 'Leads a pack that only respects consistency.' },
    { name: 'Ironclad Behemoth', lore: 'Plated in the failures of hunters who quit too soon.' },
    { name: 'Sandstorm Chimera', lore: 'Three heads, three excuses — none of them yours.' },
    { name: 'Screaming Harpy Queen', lore: 'Her cry is the sound of an alarm you almost ignored.' },
    { name: 'Verdant Devourer', lore: 'Grows a little each time someone skips their greens.' },
    { name: 'Duneborn Wyrm', lore: 'Buried until someone gets comfortable.' },
  ],
  [BossTier.LEGENDARY]: [
    { name: 'Celestial Titan', lore: 'Said to have trained the first System hunters in secret.' },
    { name: 'Ancient Guardian', lore: 'Older than the streak counter itself.' },
    { name: 'Doomforged Warlord', lore: 'Built from the armor of a hundred defeated hunters — and a hundred more who tried and quit.' },
    { name: 'Nightmare Sovereign', lore: 'Rules over every night you told yourself "tomorrow."' },
    { name: 'Sunder King', lore: 'Cracked the earth in half just to prove effort matters.' },
    { name: 'Frostmourn Empress', lore: 'Her palace is built from broken New Year resolutions.' },
    { name: 'Thousand-Blade Ronin', lore: 'Every rep you skip becomes a blade in his hand.' },
    { name: 'Chaos Incarnate', lore: 'A shape without form until your consistency gives it one.' },
    { name: 'Warden of the Iron Peaks', lore: 'Only the disciplined are allowed to pass.' },
    { name: 'The Undying Champion', lore: 'Was once mortal. Discipline is the only thing that changed that.' },
  ],
  [BossTier.MYTHIC]: [
    { name: 'Abyssal Sovereign', lore: 'Speaks in the voice of every reason you had to stay in bed.' },
    { name: 'Worldbreaker Cain', lore: 'Shattered three continents warming up.' },
    { name: 'The Hollow King', lore: 'A crown with no head beneath it — discipline was never about looking the part.' },
    { name: 'Eclipse Harbinger', lore: 'Blocks out the sun until the streak is restored.' },
    { name: 'Ragnar, the Endless Storm', lore: 'Has never once taken a rest day. Not one.' },
    { name: 'Godslayer Toji', lore: 'They say raw talent stopped mattering the day he decided to work harder than everyone else.' },
    { name: 'The Last Ascendant', lore: 'What every hunter becomes if they never stop.' },
    { name: 'Voidmaw Leviathan', lore: 'Swallowed an entire guild that trained without a plan.' },
  ],
  [BossTier.IMMORTAL]: [
    { name: 'The Monarch of Discipline', lore: 'Cannot be damaged by talent. Can only be damaged by consistency.' },
    { name: 'Architect of the System', lore: 'Wrote the rules everyone else is still trying to understand.' },
    { name: 'Eternal Sovereign', lore: 'Has no beginning and no end — like the habit it demands of you.' },
    { name: 'The First Hunter', lore: 'Before there was a System, there was just the work. This is what the work became.' },
    { name: 'Omega, Herald of the Peak', lore: 'The final wall between "trying" and "transformed."' },
    { name: 'The Unbroken', lore: 'Every rank you\'ve ever earned, it earned first — a thousand times over.' },
    { name: 'Toji Zenin, Sorcerer Killer', lore: 'No innate talent. No shortcuts. Just a body pushed further than anyone thought possible — the physique every hunter here is really chasing.' },
  ],
};

/** Flat list — useful for quick lookups / totals without caring about tier grouping. */
export const ALL_BOSSES = Object.values(BOSS_CATALOG).flat();
