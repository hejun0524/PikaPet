// panel/barLevels.js — thresholds for coloring care-meter bars.

/**
 * Below this percent a meter is "critical" (red bar); critical meters also
 * drain health (see the stats window's tick()).
 */
export const CRITICAL_BELOW = 15;

/**
 * Bar color levels as a meter empties, checked low→high.
 * Each entry: `{ className, below }` — the CSS class applies while the
 * meter's percent of max is under `below`.
 */
export const BAR_LEVELS = [
  { className: "critical", below: CRITICAL_BELOW }, // red
  { className: "low", below: 35 },                  // orange
  { className: "warn", below: 60 },                 // yellow
];
