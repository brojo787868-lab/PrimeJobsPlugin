export type MinecraftIconType =
  | 'DIAMOND_PICKAXE'
  | 'IRON_AXE'
  | 'GOLDEN_HOE'
  | 'NETHERITE_SWORD'
  | 'FISHING_ROD'
  | 'EMERALD'
  | 'GOLD_INGOT'
  | 'EXPERIENCE_BOTTLE'
  | 'BOOK'
  | 'NETHER_STAR'
  | 'ANVIL'
  | 'BARRIER'
  | 'ARROW_BACK'
  | 'DIAMOND_ORE'
  | 'GOLD_ORE'
  | 'IRON_ORE'
  | 'COAL_ORE'
  | 'ANCIENT_DEBRIS'
  | 'STONE'
  | 'OAK_LOG'
  | 'SPRUCE_LOG'
  | 'DARK_OAK_LOG'
  | 'CRIMSON_STEM'
  | 'WHEAT'
  | 'CARROT'
  | 'SUGAR_CANE'
  | 'PUMPKIN'
  | 'NETHER_WART'
  | 'ZOMBIE_HEAD'
  | 'SKELETON_SKULL'
  | 'CREEPER_HEAD'
  | 'ENDER_PEARL'
  | 'BLAZE_ROD'
  | 'COD'
  | 'SALMON'
  | 'PUFFERFISH'
  | 'NAUTILUS_SHELL'
  | 'ENCHANTED_BOOK';

export type GlassColorType = 'BLACK' | 'GRAY' | 'CYAN' | 'EMERALD' | 'PURPLE' | 'AMBER';

export type ActionType = 'BREAK' | 'KILL' | 'FISH' | 'HARVEST';

export interface JobTask {
  id: string;
  material: string;
  label: string;
  actionType: ActionType;
  baseMoney: number;
  baseXp: number;
  iconType: MinecraftIconType;
}

export interface JobPerk {
  level: number;
  title: string;
  description: string;
}

export interface JobDefinition {
  id: string;
  name: string;
  colorCode: string;
  displayName: string;
  tagline: string;
  icon: MinecraftIconType;
  materialName: string;
  slot: number;
  maxLevel: number;
  incomeMultiplierPerLevel: number; // e.g., 0.05 = +5% money per level
  xpMultiplierPerLevel: number; // e.g., 0.12 = +12% XP needed per level
  baseXpRequirement: number;
  lore: string[];
  tasks: JobTask[];
  perks: JobPerk[];
}

export interface PluginConfig {
  pluginName: string;
  packageName: string;
  version: string;
  apiVersion: string;
  guiTitle: string;
  guiRows: number;
  maxJobsPerPlayer: number;
  economySymbol: string;
  borderGlassColor: GlassColorType;
  soundOnEarn: boolean;
  actionBarEnabled: boolean;
  levelUpBroadcast: boolean;
  boosterMultiplier: number;
  jobs: JobDefinition[];
}

export interface PlayerJobProgress {
  joined: boolean;
  level: number;
  xp: number;
  totalEarned: number;
  actionsCompleted: number;
}

export interface ChatLogEntry {
  id: string;
  timestamp: string;
  type: 'SYSTEM' | 'COMMAND' | 'ECONOMY' | 'LEVEL_UP';
  mcFormattedText: string;
}

export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  pluginName: 'PrimeJobs',
  packageName: 'me.prime.jobs',
  version: '1.4.0',
  apiVersion: '1.21',
  guiTitle: '&8PrimeJobs &7— &0Select a Profession',
  guiRows: 6,
  maxJobsPerPlayer: 3,
  economySymbol: '$',
  borderGlassColor: 'BLACK',
  soundOnEarn: true,
  actionBarEnabled: true,
  levelUpBroadcast: true,
  boosterMultiplier: 1.0,
  jobs: [
    {
      id: 'miner',
      name: 'Miner',
      colorCode: '&b',
      displayName: '&b&lMiner',
      tagline: 'Excavate deep caverns, precious ores, and ancient debris.',
      icon: 'DIAMOND_PICKAXE',
      materialName: 'DIAMOND_PICKAXE',
      slot: 20,
      maxLevel: 100,
      incomeMultiplierPerLevel: 0.05,
      xpMultiplierPerLevel: 0.15,
      baseXpRequirement: 100,
      lore: [
        '&7Mine stone, ores, and ancient debris',
        '&7deep underground to earn steady money.',
        '',
        '&fStatus: %status%',
        '&fLevel: &b%level%&7/&b%max_level% &8(%xp%/%max_xp% XP)',
        '&fProgress: %progress_bar%',
        '&fIncome Bonus: &a+%income_bonus%%',
        '',
        '&e▸ Left-Click &7to Join or Leave Job',
        '&b▸ Right-Click &7to View Tasks & Payouts',
      ],
      tasks: [
        { id: 'miner-stone', material: 'STONE', label: 'Break Stone / Deepslate', actionType: 'BREAK', baseMoney: 0.75, baseXp: 1.5, iconType: 'STONE' },
        { id: 'miner-coal', material: 'COAL_ORE', label: 'Mine Coal Ore', actionType: 'BREAK', baseMoney: 2.50, baseXp: 4.0, iconType: 'COAL_ORE' },
        { id: 'miner-iron', material: 'IRON_ORE', label: 'Mine Iron Ore', actionType: 'BREAK', baseMoney: 5.00, baseXp: 8.0, iconType: 'IRON_ORE' },
        { id: 'miner-gold', material: 'GOLD_ORE', label: 'Mine Gold Ore', actionType: 'BREAK', baseMoney: 9.50, baseXp: 14.0, iconType: 'GOLD_ORE' },
        { id: 'miner-diamond', material: 'DIAMOND_ORE', label: 'Mine Diamond Ore', actionType: 'BREAK', baseMoney: 24.00, baseXp: 35.0, iconType: 'DIAMOND_ORE' },
        { id: 'miner-debris', material: 'ANCIENT_DEBRIS', label: 'Mine Ancient Debris', actionType: 'BREAK', baseMoney: 65.00, baseXp: 80.0, iconType: 'ANCIENT_DEBRIS' },
      ],
      perks: [
        { level: 10, title: 'Caver Haste I', description: '+50% base ore payout and auto-smelt chance on iron.' },
        { level: 25, title: 'Deep Vein Finder', description: 'Unlocks bonus Vault gem drops when mining Deepslate Diamond Ore.' },
        { level: 50, title: 'Master Prospector', description: 'Doubles base money earned from all Nether & End ores.' },
      ],
    },
    {
      id: 'lumberjack',
      name: 'Lumberjack',
      colorCode: '&6',
      displayName: '&6&lLumberjack',
      tagline: 'Fell towering overworld forests and crimson nether stems.',
      icon: 'IRON_AXE',
      materialName: 'IRON_AXE',
      slot: 21,
      maxLevel: 100,
      incomeMultiplierPerLevel: 0.05,
      xpMultiplierPerLevel: 0.14,
      baseXpRequirement: 100,
      lore: [
        '&7Chop down timber across all biomes',
        '&7to supply the server economy.',
        '',
        '&fStatus: %status%',
        '&fLevel: &6%level%&7/&6%max_level% &8(%xp%/%max_xp% XP)',
        '&fProgress: %progress_bar%',
        '&fIncome Bonus: &a+%income_bonus%%',
        '',
        '&e▸ Left-Click &7to Join or Leave Job',
        '&b▸ Right-Click &7to View Tasks & Payouts',
      ],
      tasks: [
        { id: 'wood-oak', material: 'OAK_LOG', label: 'Chop Oak Log', actionType: 'BREAK', baseMoney: 2.00, baseXp: 3.5, iconType: 'OAK_LOG' },
        { id: 'wood-spruce', material: 'SPRUCE_LOG', label: 'Chop Spruce Log', actionType: 'BREAK', baseMoney: 2.25, baseXp: 4.0, iconType: 'SPRUCE_LOG' },
        { id: 'wood-dark-oak', material: 'DARK_OAK_LOG', label: 'Chop Dark Oak Log', actionType: 'BREAK', baseMoney: 3.10, baseXp: 5.5, iconType: 'DARK_OAK_LOG' },
        { id: 'wood-crimson', material: 'CRIMSON_STEM', label: 'Cut Crimson Stem', actionType: 'BREAK', baseMoney: 4.80, baseXp: 8.5, iconType: 'CRIMSON_STEM' },
      ],
      perks: [
        { level: 10, title: 'Seasoned Forester', description: '+50% timber payout and reduced axe durability loss.' },
        { level: 25, title: 'Canopy Harvester', description: 'Instant leaf decay and Golden Apple drop chance.' },
        { level: 50, title: 'Prime Timber Baron', description: '2.5x Vault payouts on Dark Oak and Nether Stems.' },
      ],
    },
    {
      id: 'farmer',
      name: 'Farmer',
      colorCode: '&a',
      displayName: '&a&lFarmer',
      tagline: 'Cultivate mature crops, plantations, and alchemical nether wart.',
      icon: 'GOLDEN_HOE',
      materialName: 'GOLDEN_HOE',
      slot: 22,
      maxLevel: 100,
      incomeMultiplierPerLevel: 0.06,
      xpMultiplierPerLevel: 0.14,
      baseXpRequirement: 100,
      lore: [
        '&7Harvest fully grown crops and tend',
        '&7large estates for reliable income.',
        '',
        '&fStatus: %status%',
        '&fLevel: &a%level%&7/&a%max_level% &8(%xp%/%max_xp% XP)',
        '&fProgress: %progress_bar%',
        '&fIncome Bonus: &a+%income_bonus%%',
        '',
        '&e▸ Left-Click &7to Join or Leave Job',
        '&b▸ Right-Click &7to View Tasks & Payouts',
      ],
      tasks: [
        { id: 'farm-wheat', material: 'WHEAT', label: 'Harvest Mature Wheat', actionType: 'HARVEST', baseMoney: 1.80, baseXp: 3.0, iconType: 'WHEAT' },
        { id: 'farm-carrot', material: 'CARROTS', label: 'Harvest Carrots / Potatoes', actionType: 'HARVEST', baseMoney: 2.10, baseXp: 3.5, iconType: 'CARROT' },
        { id: 'farm-cane', material: 'SUGAR_CANE', label: 'Cut Sugar Cane', actionType: 'BREAK', baseMoney: 1.40, baseXp: 2.2, iconType: 'SUGAR_CANE' },
        { id: 'farm-pumpkin', material: 'PUMPKIN', label: 'Harvest Pumpkin / Melon', actionType: 'BREAK', baseMoney: 3.20, baseXp: 5.0, iconType: 'PUMPKIN' },
        { id: 'farm-wart', material: 'NETHER_WART', label: 'Harvest Mature Nether Wart', actionType: 'HARVEST', baseMoney: 4.50, baseXp: 7.5, iconType: 'NETHER_WART' },
      ],
      perks: [
        { level: 10, title: 'Green Thumb', description: 'Auto-replant unlocked when harvesting with a Hoe.' },
        { level: 25, title: 'Bountiful Yield', description: '20% chance for double crop drops and bonus XP orbs.' },
        { level: 50, title: 'Estate Sovereign', description: '3x Vault payout on Nether Wart and Golden Carrots.' },
      ],
    },
    {
      id: 'hunter',
      name: 'Hunter',
      colorCode: '&c',
      displayName: '&c&lHunter',
      tagline: 'Track and slay hostile monsters across the Overworld, Nether, and End.',
      icon: 'NETHERITE_SWORD',
      materialName: 'NETHERITE_SWORD',
      slot: 23,
      maxLevel: 100,
      incomeMultiplierPerLevel: 0.06,
      xpMultiplierPerLevel: 0.15,
      baseXpRequirement: 100,
      lore: [
        '&7Eliminate dangerous hostile mobs and',
        '&7collect bounties directly to your bank.',
        '',
        '&fStatus: %status%',
        '&fLevel: &c%level%&7/&c%max_level% &8(%xp%/%max_xp% XP)',
        '&fProgress: %progress_bar%',
        '&fIncome Bonus: &a+%income_bonus%%',
        '',
        '&e▸ Left-Click &7to Join or Leave Job',
        '&b▸ Right-Click &7to View Tasks & Payouts',
      ],
      tasks: [
        { id: 'hunt-zombie', material: 'ZOMBIE', label: 'Slay Zombie / Husk', actionType: 'KILL', baseMoney: 4.50, baseXp: 6.5, iconType: 'ZOMBIE_HEAD' },
        { id: 'hunt-skeleton', material: 'SKELETON', label: 'Slay Skeleton / Stray', actionType: 'KILL', baseMoney: 5.50, baseXp: 8.0, iconType: 'SKELETON_SKULL' },
        { id: 'hunt-creeper', material: 'CREEPER', label: 'Slay Creeper', actionType: 'KILL', baseMoney: 7.50, baseXp: 11.0, iconType: 'CREEPER_HEAD' },
        { id: 'hunt-enderman', material: 'ENDERMAN', label: 'Slay Enderman', actionType: 'KILL', baseMoney: 14.00, baseXp: 20.0, iconType: 'ENDER_PEARL' },
        { id: 'hunt-blaze', material: 'BLAZE', label: 'Slay Nether Blaze', actionType: 'KILL', baseMoney: 19.50, baseXp: 28.0, iconType: 'BLAZE_ROD' },
      ],
      perks: [
        { level: 10, title: 'Bounty Tracker', description: '+60% mob kill bounty and Looting bonus XP.' },
        { level: 25, title: 'Nether Slayer', description: 'Extra $15 bonus when slaying Blazes and Wither Skeletons.' },
        { level: 50, title: 'Apex Predator', description: 'Boss and Mini-Boss kills grant 3x Vault bounty.' },
      ],
    },
    {
      id: 'fisherman',
      name: 'Fisherman',
      colorCode: '&3',
      displayName: '&3&lFisherman',
      tagline: 'Cast your line for rare sea catches, sunken relics, and enchanted tomes.',
      icon: 'FISHING_ROD',
      materialName: 'FISHING_ROD',
      slot: 24,
      maxLevel: 100,
      incomeMultiplierPerLevel: 0.07,
      xpMultiplierPerLevel: 0.14,
      baseXpRequirement: 100,
      lore: [
        '&7Catch fish and reel in sunken treasures',
        '&7from oceans, rivers, and lush caves.',
        '',
        '&fStatus: %status%',
        '&fLevel: &3%level%&7/&3%max_level% &8(%xp%/%max_xp% XP)',
        '&fProgress: %progress_bar%',
        '&fIncome Bonus: &a+%income_bonus%%',
        '',
        '&e▸ Left-Click &7to Join or Leave Job',
        '&b▸ Right-Click &7to View Tasks & Payouts',
      ],
      tasks: [
        { id: 'fish-cod', material: 'COD', label: 'Catch Raw Cod', actionType: 'FISH', baseMoney: 6.00, baseXp: 9.0, iconType: 'COD' },
        { id: 'fish-salmon', material: 'SALMON', label: 'Catch Raw Salmon', actionType: 'FISH', baseMoney: 8.50, baseXp: 12.5, iconType: 'SALMON' },
        { id: 'fish-puffer', material: 'PUFFERFISH', label: 'Catch Pufferfish', actionType: 'FISH', baseMoney: 16.00, baseXp: 22.0, iconType: 'PUFFERFISH' },
        { id: 'fish-shell', material: 'NAUTILUS_SHELL', label: 'Reel Sunken Nautilus Shell', actionType: 'FISH', baseMoney: 38.00, baseXp: 48.0, iconType: 'NAUTILUS_SHELL' },
        { id: 'fish-book', material: 'ENCHANTED_BOOK', label: 'Reel Ancient Enchanted Book', actionType: 'FISH', baseMoney: 75.00, baseXp: 95.0, iconType: 'ENCHANTED_BOOK' },
      ],
      perks: [
        { level: 10, title: 'Seasoned Angler', description: '+70% catch value and increased Luck of the Sea.' },
        { level: 25, title: 'Sunken Salvager', description: 'Doubles payout on Nautilus Shells and Name Tags.' },
        { level: 50, title: 'Leviathan Master', description: 'Treasure catches award an extra $100 jackpot bonus.' },
      ],
    },
  ],
};
