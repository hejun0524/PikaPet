// adventure/adventureData.js — all static data of the Adventure world: eras,
// cities, wilderness sites, NPCs, materials, trinkets, blueprints, the
// recruit pool, and pricing constants.
//
// Adventure is a deliberately SEPARATE ecosystem: it reads only the pet's
// NAME (guild title) and the app's devMode flag (time scale). Finnies 🐟,
// materials, recruits, and all progress live in their own localStorage save
// and never touch coins, traits, or save.json. Design doc: ADVENTURE.md.

/** localStorage key holding the adventure save. */
export const ADV_SAVE_KEY = "pika-adventure-v1";

/**
 * The adventure view's tabs. The three cats get their own tabs, pushed to
 * the right edge (`push: true` starts the right-aligned group in the hub's
 * #tabs flex row).
 */
export const ADV_TABS = [
  { key: "guild", label: "Guild", tabEmoji: "🏰" },
  { key: "world", label: "World", tabEmoji: "🌍" },
  { key: "store", label: "Storehouse", tabEmoji: "📦" },
  { key: "crafts", label: "Crafthouse", tabEmoji: "🛠️" },
  { key: "pika", label: "Pika", tabEmoji: "🐱", push: true },
  { key: "darcy", label: "Darcy", tabEmoji: "🐈‍⬛" },
  { key: "noonie", label: "Noonie", tabEmoji: "🐈" },
];

/** The five eras a recruit can travel to. Each: `{ key, label }`. */
export const ADV_ERAS = [
  { key: "ancient", label: "Ancient" },
  { key: "medieval", label: "Medieval" },
  { key: "industrial", label: "Industrial" },
  { key: "information", label: "Information" },
  { key: "modern", label: "Modern" },
];

/**
 * Placeholder cities — to be replaced with a real map later (ADVENTURE.md).
 * Each: `{ key, label, travelExtra }` (extra delivery minutes).
 */
export const ADV_CITIES = [
  { key: "rome", label: "Rome", travelExtra: 5 },
  { key: "aachen", label: "Aachen", travelExtra: 8 },
];

/**
 * Delivery time = era base + city extra, in minutes. Reaching a deeper past
 * takes longer. Fixed numbers for now; may become random later (ADVENTURE.md).
 */
export const ADV_ERA_TRAVEL = { ancient: 45, medieval: 35, industrial: 25, information: 15, modern: 10 };

/** Gatherable materials, keyed by material key. Each: `{ label, value }`. */
export const ADV_MATERIALS = {
  wood: { label: "Wood", value: 4 },
  herbs: { label: "Herbs", value: 5 },
  grain: { label: "Grain", value: 3 },
  wool: { label: "Wool", value: 5 },
  mushroom: { label: "Mushrooms", value: 6 },
  stone: { label: "Stone", value: 4 },
  iron: { label: "Iron", value: 7 },
  crystal: { label: "Crystal", value: 12 },
  glass: { label: "Desert Glass", value: 6 },
  scrap: { label: "Scrap Metal", value: 5 },
  cloth: { label: "Cloth", value: 6 },
  obsidian: { label: "Obsidian", value: 10 },
  sulfur: { label: "Sulfur", value: 8 },
  circuit: { label: "Circuits", value: 14 },
  datashard: { label: "Data Shards", value: 15 },
};

/**
 * Wilderness gathering sites. `eras: null` = present in every era. The FIRST
 * yield is the primary one (recruit level adds a small bonus to it).
 * Each: `{ key, label, eras, difficulty, minutes, yields: [{key, min, max}],
 * blurb }`.
 */
export const ADV_WILDS = [
  {
    key: "forest", label: "Whispering Forest", eras: null, difficulty: 1, minutes: 20,
    yields: [{ key: "wood", min: 3, max: 6 }, { key: "herbs", min: 1, max: 3 }],
    blurb: "Old pines and older paths. Gentle work for a new recruit.",
  },
  {
    key: "farm", label: "Fallow Farmstead", eras: null, difficulty: 1, minutes: 20,
    yields: [{ key: "grain", min: 3, max: 6 }, { key: "wool", min: 1, max: 3 }],
    blurb: "Nobody tends these fields anymore, but they still give.",
  },
  {
    key: "swamp", label: "Mirebank Swamp", eras: null, difficulty: 2, minutes: 30,
    yields: [{ key: "mushroom", min: 2, max: 4 }, { key: "herbs", min: 2, max: 4 }],
    blurb: "Rich pickings for whoever doesn't mind wet boots and worse.",
  },
  {
    key: "caves", label: "Echoing Caves", eras: null, difficulty: 2, minutes: 35,
    yields: [{ key: "stone", min: 3, max: 5 }, { key: "iron", min: 2, max: 4 }, { key: "crystal", min: 0, max: 1 }],
    blurb: "The deeper galleries hold iron — and, rarely, something that glitters.",
  },
  {
    key: "desert", label: "Glass Desert", eras: null, difficulty: 2, minutes: 30,
    yields: [{ key: "glass", min: 2, max: 5 }, { key: "stone", min: 1, max: 3 }],
    blurb: "Lightning-fused sand, prized by lantern makers. Bring water.",
  },
  {
    key: "village", label: "Abandoned Village", eras: ["medieval", "industrial"], difficulty: 2, minutes: 25,
    yields: [{ key: "scrap", min: 2, max: 4 }, { key: "cloth", min: 2, max: 4 }],
    blurb: "Whoever lived here left in a hurry. Their loss, the guild's gain.",
  },
  {
    key: "volcano", label: "Cinder Volcano", eras: null, difficulty: 3, minutes: 45,
    yields: [{ key: "obsidian", min: 2, max: 4 }, { key: "sulfur", min: 1, max: 3 }],
    blurb: "Obsidian for those quick enough to grab it while it cools.",
  },
  {
    key: "cyber", label: "Cyber Dimension", eras: ["information", "modern"], difficulty: 3, minutes: 40,
    yields: [{ key: "circuit", min: 1, max: 3 }, { key: "datashard", min: 1, max: 2 }],
    blurb: "A place that is technically not a place. Materials are very real, though.",
  },
];

/**
 * The 10 NPCs who post notices. `eras`/`cities: null` = unrestricted; NPCs
 * roam anywhere in their range and move to a new spot every location slot
 * (2h, 2min in dev mode). Each: `{ key, name, eras, cities }`.
 */
export const ADV_NPCS = [
  { key: "maximus", name: "Senator Maximus", eras: ["ancient"], cities: ["rome"] },
  { key: "einhard", name: "Einhard the Scribe", eras: ["medieval"], cities: ["aachen"] },
  { key: "livia", name: "Livia the Herbalist", eras: ["ancient", "medieval"], cities: null },
  { key: "alcuin", name: "Brother Alcuin", eras: ["medieval"], cities: null },
  { key: "ada", name: "Ada the Engineer", eras: ["industrial"], cities: null },
  { key: "bell", name: "Officer Bell", eras: ["industrial", "information"], cities: null },
  { key: "iris", name: "Webmaster Iris", eras: ["information"], cities: null },
  { key: "neon", name: "DJ Neon", eras: ["information", "modern"], cities: null },
  { key: "sofia", name: "Curator Sofia", eras: null, cities: ["rome"] },
  { key: "wanderer", name: "The Wanderer", eras: null, cities: null },
];

/**
 * Trinkets: task rewards; Pika buys them back at a generous price.
 * Keyed by trinket key. Each: `{ label, price }`.
 */
export const ADV_TRINKETS = {
  sundial: { label: "Bronze Sundial", price: 30 },
  quill: { label: "Gilded Quill", price: 35 },
  locket: { label: "Silver Locket", price: 40 },
  compass: { label: "Brass Compass", price: 45 },
  musicbox: { label: "Tiny Music Box", price: 55 },
  gearheart: { label: "Gearheart Charm", price: 60 },
  prism: { label: "Signal Prism", price: 70 },
  relic: { label: "Nameless Relic", price: 90 },
};

/**
 * Blueprints: sold by Pika, unlocked PERMANENTLY once bought, assembled in
 * the Crafthouse from materials. Crafted goods answer high-value NPC
 * requests. Each: `{ key, label, price, needs: {materialKey: qty} }`.
 */
export const ADV_BLUEPRINTS = [
  { key: "tonic", label: "Herbal Tonic", price: 40, needs: { herbs: 5, mushroom: 2 } },
  { key: "lantern", label: "Glass Lantern", price: 45, needs: { glass: 4, iron: 2 } },
  { key: "cloak", label: "Woolen Cloak", price: 50, needs: { wool: 6, cloth: 2 } },
  { key: "wagon", label: "Wagon", price: 80, needs: { wood: 8, iron: 4 } },
  { key: "beacon", label: "Signal Beacon", price: 90, needs: { circuit: 3, crystal: 2, iron: 2 } },
];

// The three cats of the adventure. Pika runs the trading post; Darcy and
// Noonie sell services (all prices in Finnies 🐟):

/** Darcy: find an NPC (the sighting is valid until they move on). */
export const ADV_DARCY_LOCATE = 10;
/** Darcy Express: deliver in half the time. */
export const ADV_DARCY_EXPRESS = 15;
/** Noonie: instant heal, per remaining injury minute (minimum 5 🐟). */
export const ADV_NOONIE_PER_MIN = 0.5;

/** Everyone who can ever be hired. Each: `{ name, trade }`. */
export const ADV_RECRUIT_POOL = [
  { name: "Wren", trade: "fletcher's apprentice" },
  { name: "Bram", trade: "stonemason" },
  { name: "Hazel", trade: "herb-runner" },
  { name: "Otto", trade: "cartwright" },
  { name: "Sable", trade: "night courier" },
  { name: "Finch", trade: "mapmaker" },
  { name: "Marlow", trade: "riverhand" },
  { name: "Juniper", trade: "forager" },
  { name: "Rook", trade: "lampkeeper" },
  { name: "Edda", trade: "loomkeeper" },
  { name: "Cass", trade: "tinkerer" },
  { name: "Piper", trade: "signal-runner" },
];

/** Tokens a brand-new guild starts with. */
export const ADV_START_TOKENS = 100;

/** How many notices the board keeps posted. */
export const ADV_MAX_TASKS = 6;

/** Hiring cost, indexed by candidate level (level 0 unused). */
export const ADV_HIRE_COST = [0, 60, 120, 190];
