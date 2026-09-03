// stats/constants.js — constants that only the stats window uses.

/** Normal care-decay tick: one care point every 3 minutes. */
export const TICK_MS_NORMAL = 60_000 * 3;

/** Fast care-decay tick used while developer mode is on (Settings). */
export const TICK_MS_DEV = 10_000;

/**
 * Which care meters decay over time (health has its own rule: each critical
 * meter — below CRITICAL_BELOW percent, see panel/barLevels.js — drains
 * 1 health per tick).
 */
export const DECAY_KEYS = ["energy", "hygiene", "mood"];

/** The sitter care layer tops meters back up whenever they dip below this. */
export const SITTER_CARE_LINE = 70;

/** Coins charged for a Pet Registry change (name / call-me). */
export const GOV_FEE = 50;

/** `pika coin-shower` (Settings → Developer console) adds this many coins
 * each time it runs. */
export const COIN_SHOWER_AMOUNT = 20_000;

/** Fixed width of the tray popover window, in logical pixels. */
export const POPOVER_W = 360;
