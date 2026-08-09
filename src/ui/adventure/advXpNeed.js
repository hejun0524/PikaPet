// adventure/advXpNeed.js

/**
 * XP required to advance from the given level to the next.
 *
 * @param {number} level - The recruit's current level.
 * @returns {number} XP needed to level up.
 */
export function advXpNeed(level) {
  return 20 + 10 * (level - 1);
}
