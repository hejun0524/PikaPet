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
  { key: "market", label: "Organic Market", tabEmoji: "🥬" },
  { key: "gym", label: "Fighter's Corner", tabEmoji: "🥊" },
];

/** Noonie's-Kitchen-view tabs. */
export const KITCHEN_TABS = [
  { key: "orders", label: "Orders", tabEmoji: "📋" },
  { key: "recipes", label: "Recipes", tabEmoji: "📜" },
  { key: "pantry", label: "Pantry", tabEmoji: "🧺" },
  { key: "bots", label: "Paw-Bots", tabEmoji: "🤖" },
];

/** Fight-Club-view tabs. */
export const FIGHTCLUB_TABS = [
  { key: "club", label: "Fight Club", tabEmoji: "🥊" },
  { key: "skills", label: "Skills", tabEmoji: "📖" },
  { key: "train", label: "Training Room", tabEmoji: "🏋️" },
];

/** Extensions-view tabs. */
export const EXTENSIONS_TABS = [
  { key: "mine", label: "My Extensions", tabEmoji: "🧩" },
  { key: "market", label: "Marketplace", tabEmoji: "🛍️" },
  { key: "manager", label: "Manager", tabEmoji: "🧰" },
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
  fightclub: { emoji: "🥊" },
  kitchen: { emoji: "🍳" },
  extensions: { emoji: "🧩" },
  settings: { emoji: "⚙️" },
};

/**
 * Basket pages: full-page checkout views reached from the top-bar basket
 * buttons (cart/plan/trade/service), each with a ← Back button returning to
 * `ui.returnView`. Not real nav destinations (absent from VIEWS/the side
 * footer), but valid `setView()` targets — see hub/setView.js.
 */
export const BASKET_VIEWS = {
  cart: "🛒",
  plan: "📔",
  trade: "🤝",
  service: "🛎️",
};

/** Coins charged for a Pet Registry change (name / call-me). */
export const GOV_FEE = 50;
