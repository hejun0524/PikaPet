// adventure/advHash.js

/**
 * Deterministic 31-based string hash, used to derive stable pseudo-random
 * picks (NPC spots, daily candidate pools) from strings.
 *
 * @param {string} str - The string to hash.
 * @returns {number} A non-negative 32-bit integer hash.
 */
export function advHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
