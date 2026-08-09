// career/findCareer.js

import { CAREERS } from "./careerData.js";

/**
 * Look up a career definition by key.
 *
 * @param {string} key - Career key (e.g. "chef", "engineer").
 * @returns {object|undefined} The career entry from CAREERS
 *   (`{ key, label, emoji, trait, degrees?, jobs }`), or `undefined` if the
 *   key is unknown.
 */
export function findCareer(key) {
  return CAREERS.find((c) => c.key === key);
}
