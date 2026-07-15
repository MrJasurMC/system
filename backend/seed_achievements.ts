import { DataSource } from 'typeorm';
import { Achievement, AchievementRarity } from './src/achievements/achievement.entity';
import * as dotenv from 'dotenv';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'limitless',
  password: process.env.DB_PASSWORD || 'change_me',
  database: process.env.DB_NAME || 'project_limitless',
  entities: [__dirname + '/src/**/*.entity.ts'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

interface AchievementSeed {
  key: string;
  title: string;
  description: string;
  howToUnlock: string;
  icon: string;
  rarity: AchievementRarity;
  points: number;
  rewards?: { xp?: number; gold?: number };
  hidden?: boolean;
}

const ACHIEVEMENTS: AchievementSeed[] = [
  // ── Quest completion milestones ──
  {
    key: 'quests_1', title: 'First Step', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'Every hunter starts somewhere.',
    howToUnlock: 'Complete and claim your very first quest.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'quests_10', title: 'Building Momentum', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Ten quests down. This is starting to feel like a habit.',
    howToUnlock: 'Complete and claim 10 quests total.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'quests_50', title: 'Grinder', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 40,
    description: 'Fifty quests. The System recognizes consistent effort.',
    howToUnlock: 'Complete and claim 50 quests total.',
    rewards: { xp: 500, gold: 250 },
  },
  {
    key: 'quests_200', title: 'Relentless', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 80,
    description: 'Two hundred quests. Most people quit long before this.',
    howToUnlock: 'Complete and claim 200 quests total.',
    rewards: { xp: 2000, gold: 1000 },
  },
  {
    key: 'quests_500', title: 'Half a Thousand', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 140,
    description: 'Five hundred quests claimed. The System no longer questions your resolve.',
    howToUnlock: 'Complete and claim 500 quests total.',
    rewards: { xp: 5000, gold: 2500 },
  },
  {
    key: 'quests_1000', title: 'The Grind Never Stops', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 200,
    description: 'A thousand quests. You and the System are basically the same entity now.',
    howToUnlock: 'Complete and claim 1,000 quests total.',
    rewards: { xp: 10000, gold: 5000 },
  },
  {
    key: 'quests_5000', title: 'Beyond The Grind', icon: 'ach-quests', rarity: AchievementRarity.MYTHIC, points: 400,
    description: 'Five thousand quests claimed. There is no finish line, and you stopped looking for one long ago.',
    howToUnlock: 'Complete and claim 5,000 quests total.',
    rewards: { xp: 30000, gold: 15000 },
  },

  // ── Streak milestones ──
  {
    key: 'streak_3', title: 'Warming Up', icon: 'ach-streak', rarity: AchievementRarity.COMMON, points: 10,
    description: 'Three days straight. The hardest part is just showing up.',
    howToUnlock: 'Reach a 3-day streak.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'streak_7', title: 'One Full Week', icon: 'ach-streak', rarity: AchievementRarity.UNCOMMON, points: 25,
    description: 'Seven days without missing. A real streak now.',
    howToUnlock: 'Reach a 7-day streak.',
    rewards: { xp: 300, gold: 150 },
  },
  {
    key: 'streak_14', title: 'Two Weeks Strong', icon: 'ach-streak', rarity: AchievementRarity.UNCOMMON, points: 35,
    description: 'Fourteen days straight. The habit is starting to hold its own shape.',
    howToUnlock: 'Reach a 14-day streak.',
    rewards: { xp: 600, gold: 300 },
  },
  {
    key: 'streak_30', title: 'Iron Habit', icon: 'ach-streak', rarity: AchievementRarity.RARE, points: 60,
    description: 'Thirty days straight. This is who you are now.',
    howToUnlock: 'Reach a 30-day streak.',
    rewards: { xp: 1500, gold: 750 },
  },
  {
    key: 'streak_100', title: 'Unbreakable', icon: 'ach-streak', rarity: AchievementRarity.EPIC, points: 120,
    description: 'One hundred days. Nothing has been able to stop you.',
    howToUnlock: 'Reach a 100-day streak.',
    rewards: { xp: 6000, gold: 3000 },
  },
  {
    key: 'streak_365', title: 'A Full Year', icon: 'ach-streak', rarity: AchievementRarity.MYTHIC, points: 300,
    description: 'Three hundred sixty-five days. There is no version of you left that quits.',
    howToUnlock: 'Reach a 365-day streak.',
    rewards: { xp: 25000, gold: 10000 },
  },

  // ── Level / rank milestones (mirrors rankForLevel tiers) ──
  {
    key: 'level_5', title: 'Novice', icon: 'ach-level', rarity: AchievementRarity.COMMON, points: 15,
    description: 'You\'ve outgrown Beginner. The System takes notice.',
    howToUnlock: 'Reach character level 5.',
    rewards: { gold: 100 },
  },
  {
    key: 'level_10', title: 'Disciple', icon: 'ach-level', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Double digits. You\'re past the point of quitting quietly.',
    howToUnlock: 'Reach character level 10.',
    rewards: { gold: 250 },
  },
  {
    key: 'level_20', title: 'Elite', icon: 'ach-level', rarity: AchievementRarity.RARE, points: 50,
    description: 'Most hunters never make it this far.',
    howToUnlock: 'Reach character level 20.',
    rewards: { gold: 500 },
  },
  {
    key: 'level_35', title: 'Champion', icon: 'ach-level', rarity: AchievementRarity.EPIC, points: 90,
    description: 'A title earned, not given.',
    howToUnlock: 'Reach character level 35.',
    rewards: { gold: 1000 },
  },
  {
    key: 'level_50', title: 'Ascendant', icon: 'ach-level', rarity: AchievementRarity.LEGENDARY, points: 150,
    description: 'Halfway to the theoretical cap, and still climbing.',
    howToUnlock: 'Reach character level 50.',
    rewards: { gold: 2500 },
  },
  {
    key: 'level_75', title: 'Legend', icon: 'ach-level', rarity: AchievementRarity.MYTHIC, points: 250,
    description: 'Your name is spoken of by hunters who haven\'t met you.',
    howToUnlock: 'Reach character level 75.',
    rewards: { gold: 5000 },
  },
  {
    key: 'level_100', title: 'Mythic', icon: 'ach-level', rarity: AchievementRarity.MYTHIC, points: 500,
    description: 'The absolute ceiling. There is no one above you.',
    howToUnlock: 'Reach character level 100.',
    rewards: { gold: 10000 },
  },

  // ── World Boss ──
  {
    key: 'boss_participate_1', title: 'Into the Fray', icon: 'ach-boss', rarity: AchievementRarity.COMMON, points: 15,
    description: 'You showed up to the fight. That already puts you ahead of most.',
    howToUnlock: 'Deal damage to a World Boss for the first time.',
    rewards: { xp: 100 },
  },
  {
    key: 'boss_defeat_1', title: 'World Slayer', icon: 'ach-boss', rarity: AchievementRarity.UNCOMMON, points: 40,
    description: 'You helped bring down a World Boss.',
    howToUnlock: 'Participate in defeating a World Boss.',
    rewards: { xp: 500, gold: 200 },
  },
  {
    key: 'boss_defeat_5', title: 'Boss Hunter', icon: 'ach-boss', rarity: AchievementRarity.RARE, points: 80,
    description: 'Five World Bosses fallen because you showed up on the weekend.',
    howToUnlock: 'Participate in defeating 5 World Bosses.',
    rewards: { xp: 2000, gold: 800 },
  },
  {
    key: 'boss_defeat_20', title: 'Titan\'s Bane', icon: 'ach-boss', rarity: AchievementRarity.EPIC, points: 150,
    description: 'Twenty World Bosses. The weekend belongs to you.',
    howToUnlock: 'Participate in defeating 20 World Bosses.',
    rewards: { xp: 8000, gold: 3000 },
  },

  // ── Combo / discipline ──
  {
    key: 'combo_10', title: 'Perfect Day', icon: 'ach-combo', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Ten missions completed back-to-back in a single day.',
    howToUnlock: 'Reach a daily mission combo of 10.',
    rewards: { xp: 300, gold: 150 },
  },
  {
    key: 'combo_25', title: 'On Fire', icon: 'ach-combo', rarity: AchievementRarity.RARE, points: 60,
    description: 'Twenty-five missions in one day. The System can barely keep up.',
    howToUnlock: 'Reach a daily mission combo of 25.',
    rewards: { xp: 800, gold: 400 },
  },
  {
    key: 'combo_50', title: 'Unstoppable Momentum', icon: 'ach-combo', rarity: AchievementRarity.EPIC, points: 120,
    description: 'Fifty missions, one day. This shouldn\'t be humanly possible.',
    howToUnlock: 'Reach a daily mission combo of 50.',
    rewards: { xp: 2500, gold: 1200 },
  },

  // ── Boss participation (attack count, distinct from kill count) ──
  {
    key: 'boss_participate_10', title: 'Weekend Regular', icon: 'ach-boss', rarity: AchievementRarity.UNCOMMON, points: 25,
    description: 'Ten attacks landed on World Bosses. You never miss a weekend.',
    howToUnlock: 'Deal damage to a World Boss 10 times total.',
    rewards: { xp: 400, gold: 150 },
  },
  {
    key: 'boss_participate_50', title: 'Never Misses a Fight', icon: 'ach-boss', rarity: AchievementRarity.RARE, points: 70,
    description: 'Fifty attacks landed. Every weekend, without fail.',
    howToUnlock: 'Deal damage to a World Boss 50 times total.',
    rewards: { xp: 1500, gold: 600 },
  },

  // ── Wealth ──
  {
    key: 'gold_1000', title: 'First Fortune', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'A thousand Gold banked. Not bad for a hunter.',
    howToUnlock: 'Hold 1,000 Gold at once.',
    rewards: { xp: 100 },
  },
  {
    key: 'gold_5000', title: 'Stacking Up', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Five thousand Gold. You\'ve stopped spending it on impulse.',
    howToUnlock: 'Hold 5,000 Gold at once.',
    rewards: { xp: 300 },
  },
  {
    key: 'gold_20000', title: 'War Chest', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 60,
    description: 'Twenty thousand Gold, saved for something worth it.',
    howToUnlock: 'Hold 20,000 Gold at once.',
    rewards: { xp: 800 },
  },
  {
    key: 'gold_50000', title: 'Hunter Tycoon', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 120,
    description: 'Fifty thousand Gold. The Armory\'s mythic weapons are within reach.',
    howToUnlock: 'Hold 50,000 Gold at once.',
    rewards: { xp: 2000 },
  },
  {
    key: 'gold_100000', title: 'Vault Breaker', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 220,
    description: 'One hundred thousand Gold. You could buy out the Exchange twice over.',
    howToUnlock: 'Hold 100,000 Gold at once.',
    rewards: { xp: 4000, gold: 1000 },
  },

  // ── Weapon durability ──
  {
    key: 'weapon_break_1', title: 'First Casualty', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Your first weapon shattered mid-fight. That\'s the tradeoff for power.',
    howToUnlock: 'Break a weapon\'s durability down to zero for the first time.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'weapon_break_5', title: 'Scrap Collector', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Five weapons broken in the line of duty. The Armory knows your name.',
    howToUnlock: 'Break 5 weapons total.',
    rewards: { xp: 700, gold: 300 },
  },

  // ── Attribute mastery ──
  {
    key: 'attribute_allocated_150', title: 'Well-Rounded', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 35,
    description: 'A balanced hunter, strong in every discipline.',
    howToUnlock: 'Reach a combined total of 150 across all attributes.',
    rewards: { xp: 400, gold: 200 },
  },

  // ── Hidden / secret achievements — not shown until unlocked ──
  {
    key: 'secret_night_owl', title: 'Night Owl', icon: 'ach-secret', rarity: AchievementRarity.RARE, points: 40,
    description: 'You claimed a daily quest between midnight and 4 AM. The System never sleeps, apparently neither do you.',
    howToUnlock: '???',
    hidden: true,
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'secret_early_bird', title: 'Early Bird', icon: 'ach-secret', rarity: AchievementRarity.UNCOMMON, points: 25,
    description: 'You claimed a quest between 4 AM and 6 AM. Most of the world is still asleep.',
    howToUnlock: '???',
    hidden: true,
    rewards: { xp: 250, gold: 100 },
  },
  {
    key: 'secret_max_strength', title: 'Raw Power', icon: 'ach-secret', rarity: AchievementRarity.EPIC, points: 100,
    description: 'Fifty points in Strength. Toji would nod in approval.',
    howToUnlock: '???',
    hidden: true,
    rewards: { xp: 1500, gold: 500 },
  },
  {
    key: 'secret_max_speed', title: 'Blur', icon: 'ach-secret', rarity: AchievementRarity.EPIC, points: 100,
    description: 'Fifty points in Speed. You move before the System can track you.',
    howToUnlock: '???',
    hidden: true,
    rewards: { xp: 1500, gold: 500 },
  },
  // ── Pillar chains: started a line (accepted Rank F) ──
  {
    key: 'pillar_steel_core_started', title: 'Steel Core: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first Steel Core quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the Steel Core chain.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'pillar_predators_back_started', title: 'The Predator\'s Back: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first The Predator\'s Back quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the Predator\'s Back chain.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'pillar_titan_arms_started', title: 'Titan Arms: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first Titan Arms quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the Titan Arms chain.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'pillar_iron_grip_started', title: 'Iron Grip: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first Iron Grip quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the Iron Grip chain.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'pillar_broad_shoulders_started', title: 'The Broad Shoulders: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first The Broad Shoulders quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the The Broad Shoulders chain.',
    rewards: { xp: 50, gold: 25 },
  },
  {
    key: 'pillar_monster_legs_started', title: 'Monster Legs: First Rep', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 10,
    description: 'You accepted your first Monster Legs quest. The pillar begins.',
    howToUnlock: 'Accept Rank F of the Monster Legs chain.',
    rewards: { xp: 50, gold: 25 },
  },

  // ── Pillar chains: rank reached (per pillar, F through A) ──
  {
    key: 'pillar_steel_core_rank_f', title: 'Steel Core — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank F of Steel Core.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_steel_core_rank_e', title: 'Steel Core — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank E of Steel Core.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_steel_core_rank_d', title: 'Steel Core — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank D of Steel Core.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_steel_core_rank_c', title: 'Steel Core — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank C of Steel Core.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_steel_core_rank_b', title: 'Steel Core — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank B of Steel Core.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_steel_core_rank_a', title: 'Steel Core — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the Steel Core chain.',
    howToUnlock: 'Complete and claim Rank A of Steel Core.',
    rewards: { xp: 1200, gold: 600 },
  },
  {
    key: 'pillar_predators_back_rank_f', title: 'The Predator\'s Back — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank F of The Predator\'s Back.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_predators_back_rank_e', title: 'The Predator\'s Back — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank E of The Predator\'s Back.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_predators_back_rank_d', title: 'The Predator\'s Back — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank D of The Predator\'s Back.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_predators_back_rank_c', title: 'The Predator\'s Back — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank C of The Predator\'s Back.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_predators_back_rank_b', title: 'The Predator\'s Back — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank B of The Predator\'s Back.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_predators_back_rank_a', title: 'The Predator\'s Back — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the Predator\'s Back chain.',
    howToUnlock: 'Complete and claim Rank A of The Predator\'s Back.',
    rewards: { xp: 1200, gold: 600 },
  },
  {
    key: 'pillar_titan_arms_rank_f', title: 'Titan Arms — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank F of Titan Arms.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_titan_arms_rank_e', title: 'Titan Arms — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank E of Titan Arms.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_titan_arms_rank_d', title: 'Titan Arms — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank D of Titan Arms.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_titan_arms_rank_c', title: 'Titan Arms — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank C of Titan Arms.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_titan_arms_rank_b', title: 'Titan Arms — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank B of Titan Arms.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_titan_arms_rank_a', title: 'Titan Arms — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the Titan Arms chain.',
    howToUnlock: 'Complete and claim Rank A of Titan Arms.',
    rewards: { xp: 1200, gold: 600 },
  },
  {
    key: 'pillar_iron_grip_rank_f', title: 'Iron Grip — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank F of Iron Grip.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_iron_grip_rank_e', title: 'Iron Grip — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank E of Iron Grip.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_iron_grip_rank_d', title: 'Iron Grip — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank D of Iron Grip.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_iron_grip_rank_c', title: 'Iron Grip — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank C of Iron Grip.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_iron_grip_rank_b', title: 'Iron Grip — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank B of Iron Grip.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_iron_grip_rank_a', title: 'Iron Grip — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the Iron Grip chain.',
    howToUnlock: 'Complete and claim Rank A of Iron Grip.',
    rewards: { xp: 1200, gold: 600 },
  },
  {
    key: 'pillar_broad_shoulders_rank_f', title: 'The Broad Shoulders — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank F of The Broad Shoulders.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_broad_shoulders_rank_e', title: 'The Broad Shoulders — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank E of The Broad Shoulders.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_broad_shoulders_rank_d', title: 'The Broad Shoulders — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank D of The Broad Shoulders.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_broad_shoulders_rank_c', title: 'The Broad Shoulders — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank C of The Broad Shoulders.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_broad_shoulders_rank_b', title: 'The Broad Shoulders — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank B of The Broad Shoulders.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_broad_shoulders_rank_a', title: 'The Broad Shoulders — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the The Broad Shoulders chain.',
    howToUnlock: 'Complete and claim Rank A of The Broad Shoulders.',
    rewards: { xp: 1200, gold: 600 },
  },
  {
    key: 'pillar_monster_legs_rank_f', title: 'Monster Legs — Rank F', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'Claimed Rank F of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank F of Monster Legs.',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'pillar_monster_legs_rank_e', title: 'Monster Legs — Rank E', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 20,
    description: 'Claimed Rank E of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank E of Monster Legs.',
    rewards: { xp: 150, gold: 75 },
  },
  {
    key: 'pillar_monster_legs_rank_d', title: 'Monster Legs — Rank D', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Claimed Rank D of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank D of Monster Legs.',
    rewards: { xp: 250, gold: 125 },
  },
  {
    key: 'pillar_monster_legs_rank_c', title: 'Monster Legs — Rank C', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 50,
    description: 'Claimed Rank C of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank C of Monster Legs.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'pillar_monster_legs_rank_b', title: 'Monster Legs — Rank B', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 90,
    description: 'Claimed Rank B of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank B of Monster Legs.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'pillar_monster_legs_rank_a', title: 'Monster Legs — Rank A', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 160,
    description: 'Claimed Rank A of the Monster Legs chain.',
    howToUnlock: 'Complete and claim Rank A of Monster Legs.',
    rewards: { xp: 1200, gold: 600 },
  },

  // ── Cross-pillar tiers: all six lines at this rank or higher ──
  {
    key: 'all_pillars_rank_f', title: 'Foundations Laid', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 40,
    description: 'All six training pillars have reached Rank F or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank F.',
    rewards: { xp: 300, gold: 150 },
  },
  {
    key: 'all_pillars_rank_e', title: 'Building The Base', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 55,
    description: 'All six training pillars have reached Rank E or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank E.',
    rewards: { xp: 400, gold: 200 },
  },
  {
    key: 'all_pillars_rank_d', title: 'All Fronts Advancing', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 90,
    description: 'All six training pillars have reached Rank D or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank D.',
    rewards: { xp: 700, gold: 350 },
  },
  {
    key: 'all_pillars_rank_c', title: 'Halfway to Toji', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 140,
    description: 'All six training pillars have reached Rank C or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank C.',
    rewards: { xp: 1100, gold: 550 },
  },
  {
    key: 'all_pillars_rank_b', title: 'Six Pillars Standing', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 220,
    description: 'All six training pillars have reached Rank B or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank B.',
    rewards: { xp: 1800, gold: 900 },
  },
  {
    key: 'all_pillars_rank_a', title: 'The Complete Physique', icon: 'ach-quests', rarity: AchievementRarity.MYTHIC, points: 400,
    description: 'All six training pillars have reached Rank A or higher.',
    howToUnlock: 'Bring Steel Core, The Predator\'s Back, Titan Arms, Iron Grip, The Broad Shoulders, and Monster Legs all to Rank A.',
    rewards: { xp: 3500, gold: 1750 },
  },

  // ── First pillar mastered / total chain-quest volume ──
  {
    key: 'first_pillar_mastered', title: 'One Pillar Perfected', icon: 'ach-quests', rarity: AchievementRarity.EPIC, points: 150,
    description: 'Reached Rank A in any single training pillar first.',
    howToUnlock: 'Claim Rank A of any Project Toji chain.',
    rewards: { xp: 1500, gold: 700 },
  },
  {
    key: 'pillar_quests_10', title: 'Chain Reaction', icon: 'ach-quests', rarity: AchievementRarity.UNCOMMON, points: 30,
    description: 'Ten pillar quests claimed, across any of the six chains.',
    howToUnlock: 'Claim 10 total chain quests.',
    rewards: { xp: 300, gold: 150 },
  },
  {
    key: 'pillar_quests_20', title: 'Deep in the Program', icon: 'ach-quests', rarity: AchievementRarity.RARE, points: 60,
    description: 'Twenty pillar quests claimed.',
    howToUnlock: 'Claim 20 total chain quests.',
    rewards: { xp: 600, gold: 300 },
  },
  {
    key: 'pillar_quests_36', title: 'Every Rank, Every Line', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 300,
    description: 'Every rank of every pillar, claimed. The full Project Toji rank ladder, cleared.',
    howToUnlock: 'Claim all 36 chain quests across all six pillars.',
    rewards: { xp: 3000, gold: 1500 },
  },

  // ── Story milestones ──
  {
    key: 'story_intro_claimed', title: 'The Heavenly Restriction', icon: 'ach-quests', rarity: AchievementRarity.COMMON, points: 15,
    description: 'You accepted the call. The transformation begins.',
    howToUnlock: 'Claim the intro story quest, "The Heavenly Restriction."',
    rewards: { xp: 100, gold: 50 },
  },
  {
    key: 'story_capstone_claimed', title: 'The One Who Left It All Behind', icon: 'ach-quests', rarity: AchievementRarity.LEGENDARY, points: 250,
    description: 'You closed the final chapter of Project Toji.',
    howToUnlock: 'Claim the capstone story quest.',
    rewards: { xp: 3000, gold: 1500 },
  },
  {
    key: 'ascended', title: 'Ascended', icon: 'ach-secret', rarity: AchievementRarity.MYTHIC, points: 600,
    description: 'Every pillar mastered, every rank claimed, the story finished. There is no one above you.',
    howToUnlock: 'Reach Rank A in all six pillars, then claim the capstone story quest.',
    rewards: { xp: 10000, gold: 5000 },
  },

  // ── Additional streak tiers ──
  {
    key: 'streak_1', title: 'Day One', icon: 'ach-streak', rarity: AchievementRarity.COMMON, points: 5,
    description: 'Every legend starts on day one.',
    howToUnlock: 'Complete and claim a daily quest to start your streak.',
    rewards: { xp: 25, gold: 10 },
  },
  {
    key: 'streak_60', title: 'Two Months In', icon: 'ach-streak', rarity: AchievementRarity.RARE, points: 90,
    description: 'Sixty days without missing a beat.',
    howToUnlock: 'Reach a 60-day streak.',
    rewards: { xp: 900, gold: 450 },
  },
  {
    key: 'streak_150', title: 'Five Months Strong', icon: 'ach-streak', rarity: AchievementRarity.EPIC, points: 170,
    description: 'Half a year of discipline is closer than the finish line now.',
    howToUnlock: 'Reach a 150-day streak.',
    rewards: { xp: 2000, gold: 1000 },
  },
  {
    key: 'streak_200', title: 'Two Hundred Days', icon: 'ach-streak', rarity: AchievementRarity.EPIC, points: 220,
    description: 'Two hundred consecutive days of showing up.',
    howToUnlock: 'Reach a 200-day streak.',
    rewards: { xp: 2600, gold: 1300 },
  },
  {
    key: 'streak_500', title: 'The Long Game', icon: 'ach-streak', rarity: AchievementRarity.MYTHIC, points: 450,
    description: 'Five hundred days. This is who you are now.',
    howToUnlock: 'Reach a 500-day streak.',
    rewards: { xp: 6000, gold: 3000 },
  },
];

async function run() {
  await dataSource.initialize();

  console.log('Seeding Achievements...');
  for (const seed of ACHIEVEMENTS) {
    const existing = await dataSource.manager.findOne(Achievement, { where: { key: seed.key } });
    const achievement = existing ?? new Achievement();
    achievement.key = seed.key;
    achievement.title = seed.title;
    achievement.description = seed.description;
    achievement.howToUnlock = seed.howToUnlock;
    achievement.icon = seed.icon;
    achievement.rarity = seed.rarity;
    achievement.points = seed.points;
    achievement.hidden = seed.hidden ?? false;
    achievement.rewards = seed.rewards;
    await dataSource.manager.save(achievement);
  }

  console.log(`Success! Seeded ${ACHIEVEMENTS.length} achievements.`);
  await dataSource.destroy();
}

run().catch(console.error);
