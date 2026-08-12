// items/specialForms.js — the Legendary Cats: Pika, Darcy, and Noonie as
// pet forms. They can NEVER be purchased — each is earned by finishing one
// of the three cats' own worlds. Sprites temporarily borrow the white cat's
// sheet until their own sheets land (swap the `sheet` field then).
//
// Adding a special form (developer guide in doc/hub.md): add an entry here
// with a fresh `special` id, teach specialFormProgress() how to measure it,
// and add its "magic.cond<Id>" locale line — everything else (cards, claim
// flow, save validation) picks it up automatically.

import { ALL_PLACES } from "../touring.js";
import { CITY_DISHES } from "../kitchen.js";
import { MAX_SKILL_LEVEL, SKILLS } from "../fightclub.js";

/**
 * The special-form catalog. Same shape as SPECIES plus `special`, the
 * unlock-condition id (also picks the "magic.cond<...>" locale line).
 * No `price` — these forms are claimed, never bought.
 */
export const SPECIAL_SPECIES = [
  { key: "pika", label: "Pika", breed: "Garden Cat", sheet: "pets/white_cat.webp", special: "cities", defaultName: "Pika" },
  { key: "darcy", label: "Darcy", breed: "Tuxedo Cat", sheet: "pets/white_cat.webp", special: "skills", defaultName: "Darcy" },
  { key: "noonie", label: "Noonie", breed: "Calico Cat", sheet: "pets/white_cat.webp", special: "recipes", defaultName: "Noonie" },
];

/**
 * Progress toward a special form's unlock condition.
 *
 * @param {string} special - Condition id ("cities" | "skills" | "recipes").
 * @param {object} snap - Pet state snapshot: {touring: {visited}, kitchen:
 *   {recipes}, fightclub: {skills}} (both the stats window's `pet` and the
 *   hub's `state` mirror have these shapes).
 * @returns {{have: number, need: number}} Progress counts.
 */
export function specialFormProgress(special, snap) {
  if (special === "cities") {
    // Pika the world trader: every city and sports team visited.
    return {
      have: ALL_PLACES.reduce((sum, p) => sum + (snap.touring?.visited?.[p.key]?.length ?? 0), 0),
      need: ALL_PLACES.reduce((sum, p) => sum + p.cities.length, 0),
    };
  }
  if (special === "skills") {
    // Darcy the grandmaster: all fight skills at max level.
    return {
      have: SKILLS.filter((s) => (snap.fightclub?.skills?.[s.key] ?? 0) >= MAX_SKILL_LEVEL).length,
      need: SKILLS.length,
    };
  }
  if (special === "recipes") {
    // Noonie the chef: every city dish learned (house recipes are innate).
    const learned = snap.kitchen?.recipes ?? [];
    return {
      have: Object.keys(CITY_DISHES).filter((c) => learned.includes(`dish:${c}`)).length,
      need: Object.keys(CITY_DISHES).length,
    };
  }
  return { have: 0, need: 1 };
}

/**
 * Whether a special form's condition is fully met.
 *
 * @param {string} special - Condition id.
 * @param {object} snap - Pet state snapshot (see specialFormProgress).
 * @returns {boolean} True when claimable.
 */
export function specialFormUnlocked(special, snap) {
  const p = specialFormProgress(special, snap);
  return p.have >= p.need;
}
