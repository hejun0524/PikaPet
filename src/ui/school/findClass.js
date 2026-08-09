// school/findClass.js

import { CLASS_CATALOG } from "./schoolData.js";

/**
 * Look up a class (course) definition by key.
 *
 * @param {string} key - Class key, `"<subject>-<stage>"` (e.g. "math-grade").
 * @returns {object|undefined} The class entry from CLASS_CATALOG
 *   (`{ key, subject, stage, emoji, name, minutes, credits, cost, rewards,
 *   drain }`), or `undefined` if the key is unknown.
 */
export function findClass(key) {
  return CLASS_CATALOG.find((c) => c.key === key);
}
