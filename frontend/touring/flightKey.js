// touring/flightKey.js

/**
 * Build the ticket key for a flight to one specific city (or team).
 *
 * @param {string} city - City or team name (e.g. "Paris").
 * @returns {string} Ticket key of the form `"flight:<city>"`, as stored in
 *   the pet's tickets map and understood by findTour.
 */
export function flightKey(city) {
  return `flight:${city}`;
}
