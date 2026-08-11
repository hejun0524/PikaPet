// fightclub/fighters.js — fighter construction and the trait math shared by
// the battle engine, the odds maker, and the hub's fight-club pages.
//
// Trait roles (user design):
//   fitness → attack, guard (percent damage reduction) and bonus HP
//   smarts  → dodge chance and critical chance
//   charm   → double-turn chance and skill trigger chance
// All trait curves are soft-capped (x/(x+K)) so traits keep mattering
// without ever hitting 100%.

import { findSkill } from "./skills.js";

/** XP needed to go from `level` to the next one (higher level, more XP). */
export function xpNeed(level) {
  return 40 + 25 * (level - 1);
}

/** Minimum fraction of max fight HP required to enter the ring. */
export const FIGHT_MIN_HP = 0.3;

/**
 * Coins won or lost on the match itself (independent of any side bet).
 *
 * @param {number} oppLevel - Challenger level.
 * @returns {{win: number, loss: number}} Coins gained on a win / lost on a
 *   loss.
 */
export function fightPurse(oppLevel) {
  return { win: 25 + 7 * oppLevel, loss: 10 + 3 * oppLevel };
}

/**
 * XP for fighting a challenger of this level. Winning pays much more, and
 * punching up (a challenger above the pet's level) pays a 50% bonus.
 *
 * @param {number} oppLevel - Challenger level.
 * @param {number} petLevel - Pet's fight level.
 * @param {boolean} win - Fight outcome.
 * @returns {number} XP awarded.
 */
export function fightXp(oppLevel, petLevel, win) {
  if (!win) return 5 + 2 * oppLevel;
  const base = 14 + 5 * oppLevel;
  return oppLevel > petLevel ? Math.round(base * 1.5) : base;
}

/**
 * Max fight HP for the pet: grows with fight level, plus a fitness bonus.
 *
 * @param {number} level - Fight level (1+).
 * @param {number} fitness - Fitness trait value.
 * @returns {number} Max HP.
 */
export function maxHpFor(level, fitness) {
  return 100 + 18 * (level - 1) + Math.round(fitness * 1.5);
}

/**
 * Build the pet's fighter card from a plain snapshot.
 *
 * @param {{name: string, level: number, hp: number,
 *   traits: {fitness: number, smarts: number, charm: number},
 *   skills: Object<string, number>}} snap - Pet snapshot (traits as a plain
 *   key->value object; skills as skill key -> level).
 * @returns {object} Fighter for engine.js / odds.js.
 */
export function makePetFighter(snap) {
  const fit = snap.traits.fitness ?? 0;
  const sm = snap.traits.smarts ?? 0;
  const ch = snap.traits.charm ?? 0;
  const maxHp = maxHpFor(snap.level, fit);
  return {
    name: snap.name,
    emoji: "🐾",
    level: snap.level,
    maxHp,
    hp: Math.max(0, Math.min(maxHp, snap.hp ?? maxHp)),
    atk: 12 + 3 * (snap.level - 1) + Math.round(fit * 0.6),
    def: Math.min(0.5, fit / (fit + 120)),
    dodge: 0.04 + (sm / (sm + 150)) * 0.3,
    crit: 0.05 + (sm / (sm + 150)) * 0.3,
    dbl: (ch / (ch + 150)) * 0.35,
    skillMult: 1 + ch / (ch + 100),
    skills: Object.entries(snap.skills ?? {})
      .map(([key, lv]) => ({ s: findSkill(key), lv }))
      .filter((e) => e.s && e.lv > 0),
  };
}

/**
 * Build a challenger's fighter card from its roster entry
 * (see challengers.js). Challengers always enter at full HP.
 *
 * @param {{name: string, emoji: string, level: number,
 *   skills: {key: string, lv: number}[]}} c - CHALLENGERS entry.
 * @returns {object} Fighter for engine.js / odds.js.
 */
export function makeChallengerFighter(c) {
  const L = c.level;
  const maxHp = 80 + 13 * L;
  return {
    name: c.name,
    emoji: c.emoji,
    level: L,
    maxHp,
    hp: maxHp,
    atk: 9.5 + 2.2 * L,
    def: Math.min(0.45, L / (L + 80)),
    dodge: Math.min(0.18, 0.03 + L * 0.0035),
    crit: Math.min(0.18, 0.04 + L * 0.0035),
    dbl: Math.min(0.12, 0.015 + L * 0.0025),
    skillMult: 1,
    skills: c.skills.map(({ key, lv }) => ({ s: findSkill(key), lv })).filter((e) => e.s),
  };
}
