// adventure/advMakeRecruit.js

/**
 * Build a fresh recruit record in the shape the save file stores.
 *
 * @param {string} name - Recruit name (unique within the guild).
 * @param {string} trade - Flavor trade line (e.g. "stonemason").
 * @param {number} level - Starting level (1+).
 * @returns {{name: string, trade: string, level: number, xp: number,
 *   status: "idle"|"working"|"injured", mission: object|null,
 *   injuredUntil: number}} New idle recruit with no mission.
 */
export function advMakeRecruit(name, trade, level) {
  return { name, trade, level, xp: 0, status: "idle", mission: null, injuredUntil: 0 };
}
