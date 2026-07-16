// seed_toji_quests.ts — "Project Toji": a story quest campaign, separate
// from the daily-generated MAIN_DAILY quests (quest-generator.service.ts
// only ever touches type === MAIN_DAILY, so this content is never wiped or
// regenerated). Seven parallel quest lines (each a rank-gated chain via
// requiredPreviousQuestId + treeId/treeOrder), unlocked by an intro story
// quest and capped by a final story quest.
//
// Run with: npm run seed:toji
import { DataSource } from 'typeorm';
import { Quest, QuestType, QuestDifficulty, QuestRarity } from './src/quests/quest.entity';
import { QuestPrerequisite } from './src/quests/quest-prerequisite.entity';
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
});

type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A';

const RANK_DIFFICULTY: Record<Rank, QuestDifficulty> = {
  F: QuestDifficulty.EASY,
  E: QuestDifficulty.NORMAL,
  D: QuestDifficulty.NORMAL,
  C: QuestDifficulty.HARD,
  B: QuestDifficulty.ELITE,
  A: QuestDifficulty.LEGENDARY,
};

const RANK_RARITY: Record<Rank, QuestRarity> = {
  F: QuestRarity.COMMON,
  E: QuestRarity.UNCOMMON,
  D: QuestRarity.UNCOMMON,
  C: QuestRarity.RARE,
  B: QuestRarity.EPIC,
  A: QuestRarity.LEGENDARY,
};

const RANK_XP: Record<Rank, number> = { F: 100, E: 150, D: 250, C: 400, B: 700, A: 1200 };
const RANK_GOLD: Record<Rank, number> = { F: 50, E: 75, D: 125, C: 200, B: 350, A: 600 };

interface RankGoal {
  rank: Rank;
  goal: string;
  goalValue: number;
}

interface QuestLine {
  treeId: string;
  icon: string;
  title: string;
  goalSummary: string;
  requirements: string[];
  rewardText: string;
  ranks: RankGoal[];
}

const QUEST_LINES: QuestLine[] = [
  {
    treeId: 'toji_steel_core',
    icon: 'quest-core',
    title: 'Steel Core',
    goalSummary: 'Fast, sharp, visible abs through direct core work + low body fat.',
    requirements: ['Hollow Body Hold', 'Reverse Crunch', 'Hanging Leg Raises', 'L-Sit Progression', 'Weighted Sit-Ups'],
    rewardText: '+Core Stat, +Endurance, +Physique Points',
    ranks: [
      { rank: 'F', goal: 'Hollow Body Hold (seconds)', goalValue: 30 },
      { rank: 'E', goal: 'Reverse Crunches', goalValue: 25 },
      { rank: 'D', goal: 'Hanging Knee Raises', goalValue: 20 },
      { rank: 'C', goal: 'Hanging Leg Raises (straight leg)', goalValue: 15 },
      { rank: 'B', goal: 'L-Sit Hold (seconds)', goalValue: 15 },
      { rank: 'A', goal: 'Weighted Hanging Leg Raises (backpack +5kg) x12', goalValue: 12 },
    ],
  },
  {
    treeId: 'toji_predators_back',
    icon: 'quest-back',
    title: "The Predator's Back",
    goalSummary: 'Build an enormous V-Taper through loaded, progressive pulling.',
    requirements: ['Pull Ups', 'Wide Pull Ups', 'Chin Ups', 'Dead Hangs', 'Weighted Pull Ups'],
    rewardText: '+Strength, +Intimidation, +Athletic Appearance',
    ranks: [
      { rank: 'F', goal: 'Pull Ups', goalValue: 10 },
      { rank: 'E', goal: 'Pull Ups', goalValue: 15 },
      { rank: 'D', goal: 'Pull Ups', goalValue: 20 },
      { rank: 'C', goal: 'Pull Ups', goalValue: 25 },
      { rank: 'B', goal: 'Weighted Pull Ups (+10kg) x8', goalValue: 8 },
      { rank: 'A', goal: 'Weighted Pull Ups (+20kg) x8', goalValue: 8 },
    ],
  },
  {
    treeId: 'toji_titan_arms',
    icon: 'quest-arms',
    title: 'Titan Arms',
    goalSummary: 'Massive arms through loaded pressing and curling.',
    requirements: ['Diamond Push Ups', 'Close Grip Push Ups', 'Weighted Dips', 'Weighted Curls', 'Weighted Triceps Extensions'],
    rewardText: '+Strength, +Aesthetic Bonus',
    ranks: [
      { rank: 'F', goal: 'Push Ups (single set)', goalValue: 30 },
      { rank: 'E', goal: 'Diamond Push Ups', goalValue: 20 },
      { rank: 'D', goal: 'Close Grip Push Ups', goalValue: 25 },
      { rank: 'C', goal: 'Weighted Dips (bodyweight +10kg) x12', goalValue: 12 },
      { rank: 'B', goal: 'Weighted Dips (bodyweight +20kg) x15', goalValue: 15 },
      { rank: 'A', goal: 'Measurable arm circumference increase', goalValue: 1 },
    ],
  },
  {
    treeId: 'toji_iron_grip',
    icon: 'quest-grip',
    title: 'Iron Grip',
    goalSummary: 'Massive forearms and grip through loaded holds.',
    requirements: ['Dead Hangs', 'Towel Hangs', 'Towel Pull Ups', 'Weighted Carries'],
    rewardText: '+Grip Strength, +Forearm Size, +Real Strength',
    ranks: [
      { rank: 'F', goal: 'Dead Hang (seconds)', goalValue: 60 },
      { rank: 'E', goal: 'Dead Hang (seconds)', goalValue: 90 },
      { rank: 'D', goal: 'Dead Hang (seconds)', goalValue: 120 },
      { rank: 'C', goal: 'Dead Hang (seconds)', goalValue: 180 },
      { rank: 'B', goal: 'Weighted Dead Hangs (+10kg, seconds)', goalValue: 60 },
      { rank: 'A', goal: 'One-Arm Dead Hang, each side (seconds)', goalValue: 10 },
    ],
  },
  {
    treeId: 'toji_broad_shoulders',
    icon: 'quest-shoulders',
    title: 'The Broad Shoulders',
    goalSummary: 'Massive shoulders through vertical pressing progression.',
    requirements: ['Pike Push Ups', 'Elevated Pike Push Ups', 'Handstand Progression', 'Handstand Push Ups'],
    rewardText: '+V-Taper, +Athletic Look',
    ranks: [
      { rank: 'F', goal: 'Pike Push Ups', goalValue: 15 },
      { rank: 'E', goal: 'Pike Push Ups', goalValue: 25 },
      { rank: 'D', goal: 'Elevated Pike Push Ups', goalValue: 15 },
      { rank: 'C', goal: 'Freestanding Handstand Hold (seconds)', goalValue: 20 },
      { rank: 'B', goal: 'Wall-Assisted Handstand Push Ups', goalValue: 5 },
      { rank: 'A', goal: 'Freestanding Handstand Push Ups', goalValue: 5 },
    ],
  },
  {
    treeId: 'toji_monster_legs',
    icon: 'quest-legs',
    title: 'Monster Legs',
    goalSummary: 'Athletic, explosive, loaded legs.',
    requirements: ['Squats', 'Jump Squats', 'Bulgarian Split Squats', 'Pistol Squats', 'Weighted Split Squats'],
    rewardText: '+Speed, +Explosiveness, +Sprint Performance',
    ranks: [
      { rank: 'F', goal: 'Bodyweight Squats', goalValue: 50 },
      { rank: 'E', goal: 'Bodyweight Squats (under 5 min)', goalValue: 100 },
      { rank: 'D', goal: 'Bulgarian Split Squats (each leg)', goalValue: 15 },
      { rank: 'C', goal: 'Pistol Squats (each leg)', goalValue: 5 },
      { rank: 'B', goal: 'Jump Squats + 60s Wall Sit', goalValue: 30 },
      { rank: 'A', goal: 'Weighted Bulgarian Split Squats (+15kg, each leg)', goalValue: 15 },
    ],
  },
  {
    treeId: 'toji_crown_neck',
    icon: 'quest-neck',
    title: 'The Crown',
    goalSummary: 'Thick, powerful neck — direct training, rarely skipped.',
    requirements: ['Neck Bridges', 'Manual Resistance Flexion', 'Manual Resistance Extension', 'Manual Resistance Lateral'],
    rewardText: '+Intimidation, +Physique Points, +Real Strength',
    ranks: [
      { rank: 'F', goal: 'Manual Resistance Neck Hold, all 4 directions (seconds each)', goalValue: 10 },
      { rank: 'E', goal: 'Manual Resistance Neck Hold, all 4 directions (seconds each)', goalValue: 20 },
      { rank: 'D', goal: 'Controlled Neck Bridge Hold (seconds)', goalValue: 15 },
      { rank: 'C', goal: 'Neck Circuit: 3 sets x 3 directions x 15s', goalValue: 9 },
      { rank: 'B', goal: 'Measurable neck circumference increase', goalValue: 1 },
    ],
  },
  {
    treeId: 'toji_heavenly_restriction',
    icon: 'quest-heavenly',
    title: 'The Heavenly Restriction',
    goalSummary: 'Real Strength, Speed, Stamina and Endurance.',
    requirements: ['Sprint training', 'Running', 'Explosive jumps', 'Full body endurance circuits'],
    rewardText: '+All Stats, +Legendary Title',
    ranks: [
      { rank: 'F', goal: 'Reach Beginner Athlete level', goalValue: 1 },
      { rank: 'E', goal: 'Reach Intermediate level', goalValue: 1 },
      { rank: 'D', goal: 'Reach Advanced level', goalValue: 1 },
      { rank: 'C', goal: 'Reach Elite Human level', goalValue: 1 },
      { rank: 'B', goal: 'Reach Monster level', goalValue: 1 },
      { rank: 'A', goal: 'Achieve Heavenly Restriction', goalValue: 1 },
    ],
  },
];

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Quest);
  const prereqRepo = dataSource.getRepository(QuestPrerequisite);

  console.log('Seeding Project Toji main quest campaign...');

  // ── Intro story quest — unlocks all 7 quest lines ──
  let intro = await repo.findOne({ where: { treeId: 'toji_main', treeOrder: 0 } });
  if (!intro) intro = repo.create();
  Object.assign(intro, {
    title: 'The Heavenly Restriction',
    description: 'Forge your body into the strongest version possible through discipline, training, and consistency.',
    lore: 'Become a realistic version of Toji Fushiguro.',
    type: QuestType.STORY,
    difficulty: QuestDifficulty.EASY,
    rarity: QuestRarity.LEGENDARY,
    icon: 'quest-heavenly',
    goal: 'Begin the Project Toji campaign',
    goalValue: 1,
    xpReward: 100,
    goldReward: 0,
    isChain: true,
    treeId: 'toji_main',
    treeOrder: 0,
    requiresProof: false,
    active: true,
  });
  intro = await repo.save(intro);
  console.log(`  Intro quest saved: ${intro.title}`);

  // ── The 7 rank-gated quest lines ──
  const lineFinalQuestIds: Record<string, string> = {};
  for (const line of QUEST_LINES) {
    let previousId: string | undefined = intro.id;
    for (let i = 0; i < line.ranks.length; i++) {
      const r = line.ranks[i];
      let quest = await repo.findOne({ where: { treeId: line.treeId, treeOrder: i } });
      if (!quest) quest = repo.create();
      Object.assign(quest, {
        title: `${line.title} — Rank ${r.rank}`,
        description: `${line.goalSummary}\nRequirements: ${line.requirements.join(', ')}`,
        lore: line.rewardText,
        type: QuestType.CHAIN,
        difficulty: RANK_DIFFICULTY[r.rank],
        rarity: RANK_RARITY[r.rank],
        icon: line.icon,
        goal: r.goal,
        goalValue: r.goalValue,
        xpReward: RANK_XP[r.rank],
        goldReward: RANK_GOLD[r.rank],
        isChain: true,
        treeId: line.treeId,
        treeOrder: i,
        requiredPreviousQuestId: previousId,
        // Physique/strength milestones are self-reported, so require proof
        // (photo/metric) before a claim is accepted rather than trusting
        // the client — same anti-cheat pattern the entity already defines.
        requiresProof: true,
        active: true,
      });
      quest = await repo.save(quest);
      previousId = quest.id;
      console.log(`  ${line.title} Rank ${r.rank} saved`);
    }
    lineFinalQuestIds[line.treeId] = previousId!;
  }

  // ── Final story quest — capstone, gated on completing ALL 7 quest
  // lines (enforced via quest_prerequisites, not just the single-parent
  // requiredPreviousQuestId column, which can only express one prerequisite).
  let finale = await repo.findOne({ where: { treeId: 'toji_main', treeOrder: 1 } });
  if (!finale) finale = repo.create();
  Object.assign(finale, {
    title: 'The One Who Left It All Behind',
    description:
      'Requirements: Visible Abs, Massive V-Taper, Bigger Arms, Thick Forearms, Wide Shoulders, ' +
      'Athletic Muscular Physique, Great Strength, Great Speed, Great Stamina, High Discipline.',
    lore: 'Through countless quests and consistency, the creator became the first player of Project Limitless.',
    type: QuestType.STORY,
    difficulty: QuestDifficulty.MYTHIC,
    rarity: QuestRarity.MYTHIC,
    icon: 'quest-heavenly',
    goal: 'Complete all seven Project Toji quest lines',
    goalValue: 1,
    xpReward: 5000,
    goldReward: 2500,
    attributeReward: { discipline: 10, confidence: 10, motivation: 10 },
    itemRewards: { title: 'Heavenly Restriction' },
    isChain: true,
    treeId: 'toji_main',
    treeOrder: 1,
    requiredPreviousQuestId: undefined,
    requiresProof: true,
    active: true,
  });
  finale = await repo.save(finale);
  console.log(`  Final quest saved: ${finale.title}`);

  // Wipe and re-insert this quest's prerequisite rows so re-running the
  // seed doesn't accumulate duplicates or leave stale ones behind.
  await prereqRepo.delete({ questId: finale.id });
  const finalRankIds = Object.values(lineFinalQuestIds);
  await prereqRepo.save(
    finalRankIds.map((requiredQuestId) => prereqRepo.create({ questId: finale!.id, requiredQuestId })),
  );
  console.log(`  Final quest now requires all ${finalRankIds.length} quest lines complete.`);

  console.log('Success! Project Toji campaign seeded: 1 intro quest, 7 quest lines, 1 final quest.');
  await dataSource.destroy();
}

run().catch(console.error);
