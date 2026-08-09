// hub/constants.js — tab sets and view titles that only the hub window uses.

import { ITEM_CATALOG } from "../items.js";

/** Home-view tabs: the item categories plus Tickets and Souvenirs. */
export const HOME_TABS = [
  ...ITEM_CATALOG,
  { key: "tickets", label: "Tickets", tabEmoji: "🎫" },
  { key: "souvenirs", label: "Souvenirs", tabEmoji: "🎁" },
];

/** Achievements-view tabs. */
export const ACH_TABS = [
  { key: "degrees", label: "Degrees", tabEmoji: "🎓" },
  { key: "careers", label: "Career Tiers", tabEmoji: "💼" },
  { key: "touring", label: "World Touring", tabEmoji: "🗺️" },
  { key: "sports", label: "Sports Touring", tabEmoji: "🏟️" },
];

/** Pika-view tabs. */
export const PIKA_TABS = [
  { key: "sell", label: "Sell to Pika", tabEmoji: "🎁" },
  { key: "buy", label: "Buy from Pika", tabEmoji: "🎫" },
];

/** Pet-Center-view tabs. */
export const PETCENTER_TABS = [
  { key: "registry", label: "Registry", tabEmoji: "📋" },
  { key: "bank", label: "Bank", tabEmoji: "🏦" },
  { key: "caretakers", label: "Caretakers", tabEmoji: "🧑‍🍼" },
  { key: "magic", label: "Magic Station", tabEmoji: "🔮" },
];

/**
 * Every top-level view, keyed by the side panel's data-view values. Titles
 * are localized: emoji here + t("view.<key>") at render time.
 */
export const VIEWS = {
  home: { emoji: "🏠" },
  shopping: { emoji: "🧺" },
  career: { emoji: "💼" },
  touring: { emoji: "🗺️" },
  achievements: { emoji: "🏆" },
  government: { emoji: "💖" },
  pika: { emoji: "🐱" },
  adventure: { emoji: "⚔️" },
  arena: { emoji: "🥊" },
  addons: { emoji: "🧩" },
  settings: { emoji: "⚙️" },
};

/** Coins charged for a Pet Registry change (name / call-me). */
export const GOV_FEE = 50;
