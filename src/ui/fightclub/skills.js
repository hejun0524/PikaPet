// fightclub/skills.js — Darcy's Fight Club skill catalog. Every skill has
// MAX_SKILL_LEVEL levels; Training Manuals (found by Noonie's delivery
// bots) unlock or level up a random non-maxed skill. Combat effects land
// when the Fight Club opens — levels are collected now.

import { tOr } from "../shared/i18n.js";

/** Levels per skill. */
export const MAX_SKILL_LEVEL = 5;

/** The skill list. Each: {key, emoji, name, desc}. */
export const SKILLS = [
  { key: "plates", emoji: "🍽️", name: "Plate Toss", desc: "Opens with a volley of the day's specials." },
  { key: "bat", emoji: "🏏", name: "Bat Swing", desc: "A heavy home-run swing with real knockback." },
  { key: "playdead", emoji: "💫", name: "Apparent Death", desc: "When a KO blow lands, cling on at 1 HP instead (once per fight)." },
  { key: "jab", emoji: "🥊", name: "Lightning Jab", desc: "Fast pokes that chip away and interrupt." },
  { key: "uppercut", emoji: "💥", name: "Uppercut", desc: "A rising haymaker with a critical-hit chance." },
  { key: "kick", emoji: "🦵", name: "High Kick", desc: "A spinning kick that ignores part of the guard." },
  { key: "takedown", emoji: "🤼", name: "Takedown", desc: "Wrestle the opponent down and skip their turn." },
  { key: "guard", emoji: "🛡️", name: "Iron Guard", desc: "Brace up to shrug off part of incoming damage." },
  { key: "footwork", emoji: "👟", name: "Swift Footwork", desc: "Slippery movement that raises dodge chance." },
  { key: "zoomies", emoji: "💨", name: "Zoomies Rush", desc: "A sudden burst of cat speed — strike first." },
];

/** @param {string} key @returns {object|undefined} SKILLS entry. */
export function findSkill(key) {
  return SKILLS.find((s) => s.key === key);
}

/** Translated skill name ("skill.<key>"). */
export function skillName(skill) {
  return tOr(`skill.${skill.key}`, skill.name);
}

/** Translated skill description ("skill.<key>.desc"). */
export function skillDesc(skill) {
  return tOr(`skill.${skill.key}.desc`, skill.desc);
}
