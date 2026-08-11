// fightclub/challengers.js — the 20 challengers of Darcy's Fight Club: the
// same pets who phone in orders at Noonie's Kitchen (kitchenData CUSTOMERS),
// now moonlighting in the ring. Roster order = difficulty: Rex (level 1) is
// a warm-up, Sparkle the unicorn (level 39) is a nightmare. Each challenger's
// skill set is generated deterministically from its name, so the roster is
// identical for every player.

import { CUSTOMERS, hashStr } from "../kitchen.js";
import { SKILLS } from "./skills.js";

/**
 * The challenger roster. Each: {key, name, emoji, level,
 * skills: [{key, lv}]}. Level i-th customer = 1 + 2i (1..39); skill count
 * and levels scale with the challenger's level.
 */
export const CHALLENGERS = CUSTOMERS.map((c, i) => {
  const level = 1 + i * 2;
  const count = Math.min(6, 1 + Math.floor(level / 6));
  const lv = Math.min(5, 1 + Math.floor(level / 8));
  const start = hashStr(c.name) % SKILLS.length;
  const skills = [];
  for (let k = 0; k < count; k++) {
    skills.push({ key: SKILLS[(start + k * 7) % SKILLS.length].key, lv });
  }
  return { key: c.name.toLowerCase(), name: c.name, emoji: c.emoji, level, skills };
});

/** @param {string} key @returns {object|undefined} CHALLENGERS entry. */
export function findChallenger(key) {
  return CHALLENGERS.find((c) => c.key === key);
}
