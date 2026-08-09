// arena/simulateBattle.js — the battle engine. STUB: not implemented yet.

/**
 * Simulate a battle between two fight cards. NOT IMPLEMENTED — returns null
 * (the Arena's Fight button stays disabled until this lands).
 *
 * Design constraints for the real implementation:
 * - Turn-based (SPD picks who opens; ATK vs DEF damage; luck = crit/dodge).
 * - DETERMINISTIC: seeded RNG only (no Math.random) — the same two cards +
 *   seed must replay identically on any machine. That's what lets friends
 *   verify each other's results with no server (see the roadmap note).
 * - Returns `{winner, turns: [{actor, action, dmg, hpA, hpB}, ...]}` so the
 *   UI can play the fight back turn by turn with sprite animations
 *   (spritesheet rows 3+ have unused pounce/wave poses).
 *
 * @param {object} cardA - The challenger's fight card.
 * @param {object} cardB - The opponent's fight card.
 * @param {number} seed - RNG seed both sides agree on.
 * @returns {{winner: string, turns: object[]}|null} null until implemented.
 */
export function simulateBattle(cardA, cardB, seed) {
  void cardA; void cardB; void seed;
  return null;
}
