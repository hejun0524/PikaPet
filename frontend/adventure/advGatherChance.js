// adventure/advGatherChance.js

/**
 * Probability that a recruit returns safely from a gathering trip. Higher
 * levels help, harder terrain hurts; clamped to [0.25, 0.95].
 *
 * @param {number} level - The recruit's level.
 * @param {number} difficulty - The site's difficulty (1–3).
 * @returns {number} Success probability in [0.25, 0.95].
 */
export function advGatherChance(level, difficulty) {
  return Math.min(0.95, Math.max(0.25, 0.6 + 0.08 * level - 0.15 * difficulty));
}
