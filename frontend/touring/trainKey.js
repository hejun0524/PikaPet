// touring/trainKey.js

/**
 * Build the ticket key for a train trip in a country (random city there) —
 * or a league pass (random team of that league).
 *
 * @param {string} destKey - Place key (e.g. "france", "nba").
 * @returns {string} Ticket key of the form `"train:<destKey>"`, as stored in
 *   the pet's tickets map and understood by findTour.
 */
export function trainKey(destKey) {
  return `train:${destKey}`;
}
