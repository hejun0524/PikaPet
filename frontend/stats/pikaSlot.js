// stats/pikaSlot.js — Pika's daily want-list: Pika's store refreshes every
// 3 hours (8 slots per day).

/**
 * Compute the current Pika store slot id: the date plus the 3-hour block of
 * the day (e.g. "2026-08-08#2"). No side effects.
 *
 * @returns {string} Slot id used to detect when the store must re-roll.
 */
export function pikaSlot() {
  const now = new Date();
  return `${now.toISOString().slice(0, 10)}#${Math.floor(now.getHours() / 3)}`;
}
