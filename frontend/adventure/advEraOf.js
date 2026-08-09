// adventure/advEraOf.js

import { ADV_ERAS } from "./adventureData.js";

/**
 * Look up an era record by its key.
 *
 * @param {string} key - Era key (e.g. "ancient").
 * @returns {{key: string, label: string}|undefined} The era record, or
 *   undefined when no era has that key.
 */
export function advEraOf(key) {
  return ADV_ERAS.find((e) => e.key === key);
}
