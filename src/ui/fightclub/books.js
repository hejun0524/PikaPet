// fightclub/books.js — Skill Books (five tiers, replacing the old generic
// Training Manuals) and healing supplies for Darcy's Fight Club. Books drop
// from Noonie's deliveries (rarer tiers are rarer finds) and Pika stocks a
// few random ones — plus the healing shelf — in her Fighter's Corner tab.

import { tOr } from "../shared/i18n.js";

/**
 * The five Skill Book tiers. Each: {key, emoji, name, desc, effect fields,
 * price/priceVar (Pika's Fighter's Corner), drop (chance per finished
 * delivery), weight (relative odds per Pika book slot — better books are
 * rarer)}.
 *
 * Effects (applied in stats/initEvents.js):
 *   basic  — +1 level to one random skill
 *   twin   — +1 level to two different random skills
 *   focus  — +2 levels to one random skill
 *   wild   — +1 level to a skill YOU choose
 *   master — a skill YOU choose jumps straight to max level
 */
export const BOOKS = [
  { key: "basic", emoji: "📕", name: "Paw-Print Primer", desc: "Dog-eared beginner notes — one random skill gains a level.", price: 500, priceVar: 200, drop: 0.08, weight: 42 },
  { key: "twin", emoji: "📗", name: "Twin Fang Digest", desc: "Two lessons stapled together — two different random skills gain a level each.", price: 1200, priceVar: 300, drop: 0.035, weight: 26 },
  { key: "focus", emoji: "📘", name: "Deep Focus Tome", desc: "Heavy reading — one random skill gains two levels at once.", price: 1500, priceVar: 400, drop: 0.025, weight: 18 },
  { key: "wild", emoji: "📙", name: "Pick-a-Punch Playbook", desc: "The index actually works — choose which skill gains a level.", price: 3000, priceVar: 800, drop: 0.012, weight: 10 },
  { key: "master", emoji: "📜", name: "Grandmaster's Golden Scroll", desc: "Darcy's own annotated copy — choose a skill and master it instantly.", price: 9000, priceVar: 2000, drop: 0.004, weight: 4 },
];

/** Book tiers whose effect needs the user to choose a skill first. */
export const CHOICE_BOOKS = new Set(["wild", "master"]);

/**
 * Healing supplies sold at Pika's Fighter's Corner. Each: {key, emoji, name,
 * desc, heal (% of max fight HP restored), price, priceVar, stock (offers
 * per store refresh)}.
 */
export const POTIONS = [
  { key: "bandage", emoji: "🩹", name: "Tuna Bandage", desc: "Smells terrible, works great — restores 30% HP.", heal: 30, price: 180, priceVar: 60, stock: 2 },
  { key: "compress", emoji: "🌿", name: "Catnip Compress", desc: "Herbal, soothing, mildly euphoric — restores 60% HP.", heal: 60, price: 420, priceVar: 120, stock: 2 },
  { key: "elixir", emoji: "✨", name: "Phoenix Purr Elixir", desc: "Bottled comeback story — restores ALL HP.", heal: 100, price: 900, priceVar: 250, stock: 1 },
];

/** @param {string} key @returns {object|undefined} BOOKS entry. */
export function findBook(key) {
  return BOOKS.find((b) => b.key === key);
}

/** @param {string} key @returns {object|undefined} POTIONS entry. */
export function findPotion(key) {
  return POTIONS.find((p) => p.key === key);
}

/** Translated book name ("fcbook.<key>"). */
export function bookName(book) {
  return tOr(`fcbook.${book.key}`, book.name);
}

/** Translated book description ("fcbook.<key>.desc"). */
export function bookDesc(book) {
  return tOr(`fcbook.${book.key}.desc`, book.desc);
}

/** Translated potion name ("potion.<key>"). */
export function potionName(potion) {
  return tOr(`potion.${potion.key}`, potion.name);
}

/** Translated potion description ("potion.<key>.desc"). */
export function potionDesc(potion) {
  return tOr(`potion.${potion.key}.desc`, potion.desc);
}

/**
 * Roll the per-delivery Skill Book drop for Noonie's bots.
 *
 * @returns {string|null} A book key, or null (most deliveries).
 */
export function rollBookDrop() {
  let roll = Math.random();
  for (const book of BOOKS) {
    if (roll < book.drop) return book.key;
    roll -= book.drop;
  }
  return null;
}

/**
 * Pick one book tier for a Pika Fighter's Corner slot, weighted so better
 * books show up less often.
 *
 * @returns {string} A book key.
 */
export function rollBookOffer() {
  const total = BOOKS.reduce((sum, b) => sum + b.weight, 0);
  let roll = Math.random() * total;
  for (const book of BOOKS) {
    if (roll < book.weight) return book.key;
    roll -= book.weight;
  }
  return BOOKS[0].key;
}
