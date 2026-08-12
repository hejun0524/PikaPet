// stats/state.js — ALL mutable state of the stats window. This window is the
// single source of truth for the pet's data: it applies every mutation
// (decay tick, item use, purchases, activities), persists to save.json, and
// broadcasts "pet-state" for the other windows.

import { ALL_ITEMS, CARE_META, DEFAULT_ITEM_QTY, TRAIT_META } from "../items.js";
import { SUBJECTS } from "../school.js";
import { CAREERS } from "../career.js";
import { ALL_PLACES } from "../touring.js";
import { BOOKS, POTIONS } from "../fightclub.js";

/**
 * The pet: the authoritative game state. Mutate through the stats window's
 * functions only, then call save() + broadcastState().
 */
export const pet = {
  name: "Huanhuan",
  species: "toy_poodle", // breed label derives from the species
  forms: ["toy_poodle"], // species the pet owns and can transform into
  customForms: [], // user-uploaded pet forms: {key, breed, file in <data>/pets/}
  callMe: "Owner",
  coins: 1000,
  achievements: [],
  settings: { scale: 0.5, allDesktops: true, devMode: false, devCoins: false, language: "auto" },
  care: CARE_META.map((m) => ({ ...m, value: 100, max: 100 })),
  traits: TRAIT_META.map((m) => ({ ...m, value: 0 })),
  bag: Object.fromEntries(ALL_ITEMS.map((i) => [i.key, i.startQty ?? DEFAULT_ITEM_QTY])),
  school: {
    subjects: Object.fromEntries(SUBJECTS.map((s) => [s.key, { years: 0, credits: 0 }])),
  },
  career: {
    xp: Object.fromEntries(CAREERS.map((c) => [c.key, 0])),
  },
  // The plan is a queue of {type: "class"|"job"|"tour", key}; active adds timing.
  activity: { plan: [], active: null },
  // Hired caretaker shifts (queue of caretaker keys + the one on duty).
  caretaking: { plan: [], active: null },
  // Last known desktop position of the pet window (restored on launch).
  window: null,
  touring: {
    visited: Object.fromEntries(ALL_PLACES.map((d) => [d.key, []])),
    journals: [],
  },
  souvenirs: {}, // city name -> count
  tickets: {}, // "flight:City" / "train:dest" -> count
  pika: { date: "", wants: [], sells: [] },
  bank: { savings: 0, loan: 0, date: "" },
  homework: { date: "", count: 0 }, // daily homework limit tracking
  pinnedAddons: [], // pinned extension ids (name mirrors the historical save.json key)
  // Noonie's Kitchen: paw-bots, the 3h order board, the pantry (ingredient
  // key -> count), learned city-recipe keys, and the delivery log.
  kitchen: { bots: 2, slot: "", orders: [], pantry: {}, recipes: [], log: [] },
  // Darcy's Fight Club: Skill Books and healing supplies (key -> count),
  // skill levels (skill key -> 1..MAX_SKILL_LEVEL), the fight level + XP,
  // current fight HP (recovers over time after battles), and the W/L record.
  fightclub: {
    books: Object.fromEntries(BOOKS.map((b) => [b.key, 0])),
    potions: Object.fromEntries(POTIONS.map((p) => [p.key, 0])),
    skills: {},
    level: 1,
    xp: 0,
    hp: 100, // = maxHpFor(1, fitness 0); clamped against the live max on use
    record: { wins: 0, losses: 0 },
  },
};

/**
 * Care meters were renamed once; accept values saved under the old names
 * (new key -> legacy key).
 */
export const LEGACY_CARE_KEYS = {
  energy: "fullness",
  hygiene: "freshness",
  mood: "happiness",
};

/**
 * Non-persistent runtime flags of the stats window:
 * - `saveEnabled`: false during a first run until the setup window finishes,
 *   so quitting mid-setup keeps the app in the first-run state.
 * - `installedExtensions`: raw manifest entries from the Rust extension scan.
 * - `lastPopoverH`: last applied popover height (skip no-op resizes).
 * - `trayCompact`: the ▾ minimized-popover toggle (persisted in localStorage).
 * - `scheduleStep`: rotation cursor of the caretaker schedule layer.
 * - `lastDecayAt`: timestamp of the last care-decay tick.
 * - `lastFcRegenAt`: timestamp of the last fight-HP regeneration tick
 *   (recovery pauses while the app is closed, like activities).
 */
export const runtime = {
  saveEnabled: true,
  installedExtensions: [],
  lastPopoverH: 0,
  trayCompact: localStorage.getItem("trayCompact") === "1",
  scheduleStep: 0,
  lastDecayAt: Date.now(),
  lastFcRegenAt: Date.now(),
  dataPaths: null, // {root, addons, pets, isDefault} from get_data_paths
};

/** Extension tray widgets: extension id -> last pushed widget state. */
export const widgetStates = new Map();
