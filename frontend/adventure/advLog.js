// adventure/advLog.js

import { adv } from "./state.js";

/**
 * Append a line to the guild chronicle, trimming the log to its last 40
 * entries. Does NOT save — callers batch advSave() after their mutation.
 *
 * @param {string} text - The chronicle line to record.
 * @returns {void}
 */
export function advLog(text) {
  adv.log.push({ at: Date.now(), text });
  if (adv.log.length > 40) adv.log.splice(0, adv.log.length - 40);
}
