// school/formatRemaining.js

/**
 * Format a remaining duration as a compact countdown for status rows.
 *
 * @param {number} ms - Remaining milliseconds (negative values clamp to 0).
 * @returns {string} `"m:ss"` under an hour, `"h:mm:ss"` from one hour up
 *   (e.g. "4:05", "1:02:33").
 */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
