// touring/pickRandomCities.js

/**
 * Pick `n` DISTINCT uniformly-random entries from a list (fewer if the list
 * is shorter than `n`). The input list is not modified.
 *
 * @param {string[]} cities - Pool to pick from (cities, teams, keys…).
 * @param {number} n - How many distinct picks to make.
 * @returns {string[]} The picked entries, in pick order.
 */
export function pickRandomCities(cities, n) {
  const pool = [...cities];
  const picked = [];
  while (picked.length < n && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}
