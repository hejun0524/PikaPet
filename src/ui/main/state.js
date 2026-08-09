// main/state.js — ALL mutable state and constants of the pet window (the
// desktop sprite): DOM handles, sprite-sheet geometry, the latest broadcast
// snapshot, and the trip/animation flags.

import { getCurrentWindow } from "../shared/tauri.js";

/** The pet sprite element (`#pet`); its data-anim attribute picks the row. */
export const petEl = document.getElementById("pet");

/** The speech-bubble element (`#bubble`). */
export const bubbleEl = document.getElementById("bubble");

/** Handle of this (the pet) window. */
export const appWindow = getCurrentWindow();

// Native sprite cell size; the displayed size is CELL * settings.scale,
// applied via CSS zoom + a matching window resize. The window is taller and
// wider than the sprite to leave room for the speech bubble.
export const CELL_W = 192;
export const CELL_H = 208;
export const BUBBLE_SPACE = 96;
export const MIN_WINDOW_W = 280; // also the speech bubble's max width

/** Fallbacks applied when save.json has no settings yet. */
export const DEFAULT_SETTINGS = { scale: 0.5, allDesktops: true };

/** Below this percent a meter triggers a complaint line. Matches the orange
 * "low" tier in panel/barLevels.js. */
export const LOW_LINE = 35;

/** Below this health the pet says it is sick. Matches SICK_BELOW in
 * touring/touringData.js. */
export const SICK_LINE = 80;

/** Minimum time between two complaint lines. */
export const COMPLAINT_COOLDOWN_MS = 3 * 60_000;

/** Below this mood percent the pet mopes around (sprite row 5) instead of
 * idling. */
export const SAD_MOOD_BELOW = 35;

/** Horizontal pixels per 16ms frame of the trip travel animation. */
export const TRAVEL_STEP_PX = 16;

/** Manual double-click detection window (startDragging swallows dblclick). */
export const DOUBLE_CLICK_MS = 400;

/**
 * Right-click menu views, in menu order, with their emoji. Labels come from
 * the locale files (t("view.<key>")) when the menu is built.
 */
export const VIEW_EMOJI = {
  home: "🏠",
  shopping: "🧺",
  career: "💼",
  touring: "🗺️",
  achievements: "🏆",
  government: "💖",
  pika: "🐱",
  adventure: "⚔️",
  arena: "🥊",
  addons: "🧩",
};

/**
 * Latest snapshot of what the pet knows about itself (from "pet-state"
 * broadcasts): what to call the owner, care values, the newest journal
 * entry, and the active activity/caretaking entries.
 */
export const latest = { callMe: "Owner", care: {}, journal: null, activity: null, caretaking: null };

/**
 * Trip travel state: whether the pet is away on a tour, plus the monitor,
 * position, and window size captured at departure (used to come home).
 */
export const trip = { away: false, homePos: null, monitor: null, size: null };

/**
 * Non-persistent runtime flags of the pet window:
 * - `animating`: a travel animation is running (blocks other movement).
 * - `isSad`: mood is below SAD_MOOD_BELOW (idle animation becomes "sad").
 * - `currentSpecies`: sprite sheet currently applied.
 * - `bubbleTimer`: timeout id hiding the speech bubble.
 * - `lastComplaintAt`: timestamp of the last complaint line.
 * - `lastPressAt`: timestamp of the last mousedown (double-click detection).
 * - `lastX`: last seen window x (drag direction detection).
 * - `settleTimer`: timeout id detecting the end of a drag.
 */
export const rt = {
  animating: false,
  isSad: false,
  currentSpecies: "toy_poodle",
  bubbleTimer: null,
  lastComplaintAt: 0,
  lastPressAt: 0,
  lastX: null,
  settleTimer: null,
};
