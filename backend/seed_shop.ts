import { DataSource } from 'typeorm';
import { Item, ItemType, ItemCategory, ItemRarity } from './src/inventory/item.entity';
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

const REWARDS = [
  // Commons
  { name: 'Gaming 1 Hour', category: ItemCategory.ENTERTAINMENT, rarity: ItemRarity.COMMON, price: 100, icon: 'item-entertainment' },
  { name: 'Watch Anime 1 Hour', category: ItemCategory.ENTERTAINMENT, rarity: ItemRarity.COMMON, price: 100, icon: 'item-entertainment' },
  { name: 'Favorite Snack', category: ItemCategory.FOOD, rarity: ItemRarity.COMMON, price: 150, icon: 'item-food' },
  { name: 'Sleep Extra 1 Hour', category: ItemCategory.RECOVERY, rarity: ItemRarity.COMMON, price: 120, icon: 'item-recovery' },
  { name: 'Buy Coffee/Drink', category: ItemCategory.FOOD, rarity: ItemRarity.COMMON, price: 80, icon: 'item-food' },
  { name: 'Scroll Social Media 30m', category: ItemCategory.LIFESTYLE, rarity: ItemRarity.COMMON, price: 50, icon: 'item-lifestyle' },

  // Rares
  { name: 'Gaming 3 Hours', category: ItemCategory.ENTERTAINMENT, rarity: ItemRarity.RARE, price: 300, icon: 'item-entertainment' },
  { name: 'Movie Night', category: ItemCategory.ENTERTAINMENT, rarity: ItemRarity.RARE, price: 350, icon: 'item-entertainment' },
  { name: 'Fast Food Meal', category: ItemCategory.FOOD, rarity: ItemRarity.RARE, price: 400, icon: 'item-food' },
  { name: 'Buy Manga/Book', category: ItemCategory.LIFESTYLE, rarity: ItemRarity.RARE, price: 500, icon: 'item-lifestyle' },

  // Epics
  { name: 'Gaming All Night', category: ItemCategory.ENTERTAINMENT, rarity: ItemRarity.EPIC, price: 800, icon: 'item-entertainment' },
  { name: 'Cheat Meal Day', category: ItemCategory.FOOD, rarity: ItemRarity.EPIC, price: 1000, icon: 'item-food' },
  { name: 'Buy New Game', category: ItemCategory.PREMIUM, rarity: ItemRarity.EPIC, price: 1500, icon: 'item-premium' },

  // Legendaries
  { name: 'Full Rest Day', category: ItemCategory.RECOVERY, rarity: ItemRarity.LEGENDARY, price: 2500, icon: 'item-recovery', reqs: { requiredStreak: 10 } },
  { name: 'Buy Premium Item', category: ItemCategory.PREMIUM, rarity: ItemRarity.LEGENDARY, price: 5000, icon: 'item-premium', reqs: { minLevel: 10 } },
];

// Weapons — bought from the Exchange, chosen per-attack in the World Boss
// "choose weapon" panel. attackBonus adds flat damage per rep; maxDurability
// is how many boss attacks a single copy survives (0 = unbreakable). The
// tradeoff is deliberate: a 1000+ bonus weapon that never broke would let one
// player solo a boss meant for a whole week's worth of participants, so power
// and durability scale in opposite directions — the strongest weapons are
// single-fight consumables, not permanent gear.
const WEAPONS = [
  // ── Knives — cheap, durable, low power. Good starter/backup weapons. ──
  { name: 'Training Knife', family: 'knife', rarity: ItemRarity.COMMON, price: 300, attackBonus: 1, maxDurability: 0, desc: 'A worn practice blade. Barely sharp, but it\'s a start.' },
  { name: 'Iron Knife', family: 'knife', rarity: ItemRarity.COMMON, price: 500, attackBonus: 2, maxDurability: 0, desc: 'Balanced and reliable. Favored by early risers.' },
  { name: 'Serrated Knife', family: 'knife', rarity: ItemRarity.UNCOMMON, price: 800, attackBonus: 4, maxDurability: 30, desc: 'Bites deeper than it looks. Edge dulls with heavy use.' },
  { name: 'Hunter\'s Knife', family: 'knife', rarity: ItemRarity.UNCOMMON, price: 1000, attackBonus: 5, maxDurability: 25, desc: 'Built for sustained work, not one big swing.' },
  { name: 'Shadowfang Dagger', family: 'knife', rarity: ItemRarity.RARE, price: 2200, attackBonus: 9, maxDurability: 15, desc: 'Strikes fast, wears fast.', reqs: { requiredStreak: 5 } },

  // ── Swords — the mid-tier workhorse family. ──
  { name: 'Wooden Sword', family: 'sword', rarity: ItemRarity.COMMON, price: 400, attackBonus: 2, maxDurability: 0, desc: 'Heavier than it looks. Builds the habit of committing to every strike.' },
  { name: 'Iron Sword', family: 'sword', rarity: ItemRarity.UNCOMMON, price: 900, attackBonus: 4, maxDurability: 0, desc: 'A dependable blade with no gimmicks.' },
  { name: 'Steel Sword', family: 'sword', rarity: ItemRarity.UNCOMMON, price: 1400, attackBonus: 6, maxDurability: 40, desc: 'A proper blade for a System Hunter who shows up daily.' },
  { name: 'Twin Blades', family: 'sword', rarity: ItemRarity.RARE, price: 2800, attackBonus: 9, maxDurability: 20, desc: 'Dual-wielded. Rewards consistency with devastating boss damage.', reqs: { minLevel: 15 } },
  { name: 'Crimson Edge', family: 'sword', rarity: ItemRarity.RARE, price: 3400, attackBonus: 12, maxDurability: 12, desc: 'Drinks deep, doesn\'t last long.', reqs: { minLevel: 18 } },
  { name: 'Void-Forged Katana', family: 'sword', rarity: ItemRarity.EPIC, price: 6000, attackBonus: 22, maxDurability: 8, desc: 'Cuts through the boss\'s defenses like they aren\'t there. Won\'t stay sharp for long.', reqs: { minLevel: 22, requiredStreak: 10 } },
  { name: 'Heavenly Restriction Blade', family: 'sword', rarity: ItemRarity.LEGENDARY, price: 9000, attackBonus: 30, maxDurability: 5, desc: 'Forged for those who trained past their limits. No sorcery, just relentless reps.', reqs: { minLevel: 25, requiredStreak: 14 } },

  // ── Blunt / heavy weapons — high damage, chunky durability cost. ──
  { name: 'Training Mace', family: 'blunt', rarity: ItemRarity.COMMON, price: 450, attackBonus: 3, maxDurability: 0, desc: 'Blunt force, no finesse required.' },
  { name: 'War Hammer', family: 'blunt', rarity: ItemRarity.UNCOMMON, price: 1300, attackBonus: 7, maxDurability: 35, desc: 'Every swing rattles your bones — and the boss\'s.' },
  { name: 'Titan Warhammer', family: 'blunt', rarity: ItemRarity.RARE, price: 3200, attackBonus: 14, maxDurability: 10, desc: 'Meant for one target: whatever\'s in front of it.', reqs: { minLevel: 16 } },
  { name: 'Colossus Crusher', family: 'blunt', rarity: ItemRarity.EPIC, price: 6500, attackBonus: 26, maxDurability: 6, desc: 'Named for what it does to bosses, not who wields it.', reqs: { minLevel: 24 } },

  // ── Bows — ranged, moderate durability. ──
  { name: 'Practice Bow', family: 'bow', rarity: ItemRarity.COMMON, price: 400, attackBonus: 2, maxDurability: 0, desc: 'Splintery, but it flies straight.' },
  { name: 'Longbow', family: 'bow', rarity: ItemRarity.UNCOMMON, price: 1100, attackBonus: 5, maxDurability: 30, desc: 'Steady draw, steady damage.' },
  { name: 'Stormcaller Bow', family: 'bow', rarity: ItemRarity.RARE, price: 2900, attackBonus: 11, maxDurability: 14, desc: 'Each arrow cracks like thunder. The string can\'t take many more.', reqs: { requiredStreak: 10 } },
  { name: 'Phoenix Feather Bow', family: 'bow', rarity: ItemRarity.EPIC, price: 6200, attackBonus: 24, maxDurability: 7, desc: 'Burns brighter than it lasts.', reqs: { minLevel: 20 } },

  // ── Mage staffs — the highest ceiling in the game, shortest lifespan. ──
  { name: 'Apprentice Staff', family: 'staff', rarity: ItemRarity.COMMON, price: 500, attackBonus: 3, maxDurability: 0, desc: 'Flickers more than it burns, but everyone starts somewhere.' },
  { name: 'Battle Staff', family: 'staff', rarity: ItemRarity.UNCOMMON, price: 1500, attackBonus: 8, maxDurability: 28, desc: 'Slower to master, brutal in disciplined hands.', reqs: { requiredStreak: 7 } },
  { name: 'Arcane Focus Staff', family: 'staff', rarity: ItemRarity.RARE, price: 3600, attackBonus: 16, maxDurability: 10, desc: 'Channels more power than it can safely hold.', reqs: { minLevel: 20 } },
  { name: 'Void Star Staff', family: 'staff', rarity: ItemRarity.EPIC, price: 7500, attackBonus: 35, maxDurability: 4, desc: 'Each cast is a small explosion. The core cracks a little more each time.', reqs: { minLevel: 28, requiredStreak: 14 } },
  { name: 'Sunblade Staff', family: 'staff', rarity: ItemRarity.MYTHIC, price: 15000, attackBonus: 60, maxDurability: 3, desc: 'The strongest weapon in the Armory. Three strikes, then it burns out completely.', reqs: { minLevel: 35, requiredStreak: 21 } },
  { name: 'Celestial Ruin', family: 'staff', rarity: ItemRarity.CELESTIAL, price: 25000, attackBonus: 100, maxDurability: 1, desc: 'One attack. One boss. That\'s all it was ever meant for.', reqs: { minLevel: 45, requiredStreak: 30 } },
];

async function run() {
  await dataSource.initialize();
  
  console.log('Clearing old shop items...');
  await dataSource.manager.query('TRUNCATE TABLE "items" CASCADE');

  console.log('Seeding Real Life Rewards...');
  
  const savedItems: Item[] = [];

  for (const reward of REWARDS) {
    const item = new Item();
    item.name = reward.name;
    item.description = `Guilt-free ${reward.name} reward unlocked by your discipline.`;
    item.type = ItemType.REWARD;
    item.category = reward.category;
    item.rarity = reward.rarity;
    item.goldPrice = reward.price;
    item.sellValue = 0; // cannot sell rewards back
    item.icon = reward.icon;
    item.isLimited = false;
    item.weekRotation = true;
    if (reward.reqs) {
      item.unlockRequirements = reward.reqs;
    }
    const saved = await dataSource.manager.save(item);
    savedItems.push(saved);
  }

  console.log('Seeding Weapons (permanent Armory listings)...');
  const WEAPON_ICONS: Record<string, string> = {
    knife: 'weapon-knife',
    sword: 'weapon-sword',
    blunt: 'weapon-blunt',
    bow: 'weapon-bow',
    staff: 'weapon-staff',
  };
  for (const weapon of WEAPONS) {
    const item = new Item();
    item.name = weapon.name;
    item.description = weapon.desc;
    item.type = ItemType.WEAPON;
    item.category = ItemCategory.PREMIUM;
    item.rarity = weapon.rarity;
    item.goldPrice = weapon.price;
    item.sellValue = Math.floor(weapon.price * 0.4);
    item.attackBonus = weapon.attackBonus;
    item.maxDurability = weapon.maxDurability;
    item.icon = WEAPON_ICONS[weapon.family] ?? 'weapon-sword';
    item.isLimited = false;
    item.weekRotation = false; // never rotated out by the Monday reset
    item.inExchange = true; // always purchasable
    item.exchangeExpiresAt = null;
    if (weapon.reqs) {
      item.unlockRequirements = weapon.reqs;
    }
    await dataSource.manager.save(item);
  }

  console.log('Populating the Exchange for this week...');
  const shuffle = (array: Item[]) => array.sort(() => 0.5 - Math.random());
    
  const commons = shuffle(savedItems.filter(i => i.rarity === ItemRarity.COMMON)).slice(0, 5);
  const rares = shuffle(savedItems.filter(i => i.rarity === ItemRarity.RARE)).slice(0, 3);
  const epics = shuffle(savedItems.filter(i => i.rarity === ItemRarity.EPIC)).slice(0, 1);
  const legendaries = shuffle(savedItems.filter(i => i.rarity === ItemRarity.LEGENDARY)).slice(0, 1);

  const newItems = [...commons, ...rares, ...epics, ...legendaries];

  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  for (const item of newItems) {
    item.inExchange = true;
    item.exchangeExpiresAt = nextMonday;
    await dataSource.manager.save(item);
  }

  console.log(`Success! Seeded ${savedItems.length} items, and placed ${newItems.length} into the weekly rotation.`);
  await dataSource.destroy();
}

run().catch(console.error);
