// hub/state.js — ALL mutable state of the hub window, in one place so every
// function file imports the same objects. Nothing here is persisted directly:
// `state` mirrors the stats window's broadcasts, and the carts/baskets are
// purely local until checkout / start.

import {
  ALL_ITEMS,
  CARE_META,
  CAREER_CATALOG,
  DEFAULT_ITEM_QTY,
  ITEM_CATALOG,
  SHOP_CATALOG,
  TOURING_TABS,
  TRAIT_META,
} from "../items.js";
import { SUBJECTS } from "../school.js";
import { CAREERS } from "../career.js";
import { ALL_PLACES, DESTINATIONS, SPORT_LEAGUES } from "../touring.js";
import { ACH_TABS, PETCENTER_TABS, PIKA_TABS } from "./constants.js";

/**
 * Display-only mirror of the pet's state; the stats window owns the truth.
 * This window emits "use-item" (Home), "buy-cart" (Shopping), "start-plan" /
 * "end-activity" (Career), "gov-update" (Government) and "settings-changed"
 * (Settings); updates return via "pet-state" (see hub/applyState.js).
 */
export const state = {
  name: "Huanhuan",
  species: "toy_poodle", // breed label derives from the species
  forms: ["toy_poodle"],

  callMe: "Owner",
  coins: 1000,
  achievements: [],
  customForms: [], // user-uploaded pet forms: {key, breed, file}
  care: Object.fromEntries(CARE_META.map((m) => [m.key, 100])),
  traits: Object.fromEntries(TRAIT_META.map((m) => [m.key, 0])),
  bag: Object.fromEntries(ALL_ITEMS.map((i) => [i.key, i.startQty ?? DEFAULT_ITEM_QTY])),
  school: {
    subjects: Object.fromEntries(SUBJECTS.map((s) => [s.key, { years: 0, credits: 0 }])),
  },
  career: {
    xp: Object.fromEntries(CAREERS.map((c) => [c.key, 0])),
  },
  activity: { plan: [], active: null },
  caretaking: { plan: [], active: null },
  touring: {
    visited: Object.fromEntries(ALL_PLACES.map((d) => [d.key, []])),
    journals: [],
  },
  souvenirs: {},
  tickets: {},
  pika: { date: "", wants: [], sells: [] },
  bank: { savings: 0, loan: 0, date: "" },
  kitchen: { bots: 2, slot: "", orders: [], pantry: {}, recipes: [], log: [] },
  fightclub: {
    books: {},
    potions: {},
    skills: {},
    level: 1,
    xp: 0,
    hp: 100,
    record: { wins: 0, losses: 0 },
  },
  extensionsInstalled: [],
  pinnedAddons: [], // pinned extension ids; name mirrors the historical save.json key
};

/**
 * UI navigation/mode state: the current view, the active tab of each tabbed
 * view, and transient page modes (pending Magic Station purchase, reset
 * confirmation, extension manager message).
 */
export const ui = {
  view: "home",
  homeTab: ITEM_CATALOG[0].key,
  shopTab: SHOP_CATALOG[0].key,
  careerTab: CAREER_CATALOG[0].key,
  touringTab: TOURING_TABS[0].key,
  jobCareer: CAREERS[0].key,
  schoolSubject: SUBJECTS[0].key,
  tourDest: DESTINATIONS[0].key,
  sportLeague: SPORT_LEAGUES[0].key,
  achTab: ACH_TABS[0].key,
  pikaTab: PIKA_TABS[0].key,
  petcenterTab: PETCENTER_TABS[0].key,
  kitchenTab: "orders",
  fightclubTab: "club",
  extensionsTab: "mine",
  market: null, // marketplace fetch state: {status: "loading"|"ready"|"error", assets: []}
  fightBet: 0, // side-bet stake selected on the Fight Club page
  battle: null, // live fight replay: the "fight-result" payload + {idx, done}
  trainMsg: null, // last "fightclub-result" payload shown in the Training Room
  pickerBook: null, // choice-book key awaiting a skill pick (wild/master)
  pendingMagic: null, // species key awaiting purchase confirmation
  createPending: false, // Magic Station showing the name-your-creation card
  resetPending: false, // Settings page showing the reset confirmation
  extensionMsg: "", // last install/uninstall result shown on the Manager tab
  dataPaths: null, // {root, addons, pets, isDefault} from get_data_paths
  storageMsg: "", // last change-folder error shown on the Settings page
  magicMsg: "", // last custom-form import error shown at the Magic Station
  deleteFormPending: null, // custom-form key awaiting delete confirmation
  returnView: null, // view to restore when leaving a basket page (see BASKET_VIEWS)
};

/** Shopping cart: item key -> quantity. Local until "buy-cart" checkout. */
export const cart = new Map();

/** Pika trade basket, sell side: souvenir cities staged to sell (one each). */
export const tradeSell = new Set();

/** Pika trade basket, buy side: offer id -> offer object. */
export const tradeBuy = new Map();

/** Pika trade basket, grocery side: ingredient key -> quantity staged. */
export const tradeIng = new Map();

/**
 * The two stage-then-commit lists that get reassigned wholesale:
 * - `planBook`: career plan entries `[{type: "class"|"job", key}]` until
 *   "start-plan".
 * - `serviceCart`: caretaker keys staged to hire (duplicates = extra shifts)
 *   until "hire-caretakers".
 */
export const baskets = {
  planBook: [],
  serviceCart: [],
};

/** Mirrors save.json's settings; edited here, persisted by the stats window. */
export const appSettings = {
  scale: 0.6,
  allDesktops: true,
  devMode: false,
  devCoins: false,
  language: "auto",
  pauseOnSleep: true,
};
