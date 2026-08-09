// adventure/advRemainText.js

/**
 * Format the time remaining until a timestamp as a short human string:
 * "any moment", "42s", "17m", or "2h 5m".
 *
 * @param {number} endsAt - Target timestamp (ms since epoch).
 * @returns {string} Human-readable remaining time.
 */
export function advRemainText(endsAt) {
  const ms = Math.max(0, endsAt - Date.now());
  if (ms === 0) return "any moment";
  const s = Math.ceil(ms / 1000);
  if (s < 120) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
