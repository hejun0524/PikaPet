// adventure/advGrantXp.js

import { advLog } from "./advLog.js";
import { advXpNeed } from "./advXpNeed.js";

/**
 * Grant XP to a recruit, applying any level-ups it earns. Mutates the
 * recruit record and logs each level gained via advLog(); does not save.
 *
 * @param {object} recruit - The recruit record to modify.
 * @param {number} xp - XP to add.
 * @returns {void}
 */
export function advGrantXp(recruit, xp) {
  recruit.xp += xp;
  while (recruit.xp >= advXpNeed(recruit.level)) {
    recruit.xp -= advXpNeed(recruit.level);
    recruit.level++;
    advLog(`${recruit.name} reached level ${recruit.level}.`);
  }
}
