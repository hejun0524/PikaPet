// items/findCaretaker.js

import { CARETAKERS } from "./caretakers.js";

/**
 * Look up a caretaker definition by key.
 *
 * @param {string} key - Caretaker key (e.g. "sitter", "nanny").
 * @returns {object|undefined} The caretaker entry from CARETAKERS
 *   (`{ key, emoji, name, desc, price, care?, schedule? }`), or `undefined`
 *   if the key is unknown.
 */
export function findCaretaker(key) {
  return CARETAKERS.find((c) => c.key === key);
}
