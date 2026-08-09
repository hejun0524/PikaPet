// school/findSubject.js

import { SUBJECTS } from "./schoolData.js";

/**
 * Look up a subject definition by key.
 *
 * @param {string} key - Subject key (e.g. "math", "literature").
 * @returns {object|undefined} The subject entry from SUBJECTS
 *   (`{ key, label, emoji }`), or `undefined` if the key is unknown.
 */
export function findSubject(key) {
  return SUBJECTS.find((s) => s.key === key);
}
