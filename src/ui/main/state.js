// main/state.js — ALL mutable state and constants of the pet window (the
// desktop sprite): DOM handles, sprite-sheet geometry, the latest broadcast
// snapshot, and the trip/animation flags.

import { getCurrentWindow } from "../shared/tauri.js";

/** The pet sprite viewport (`#pet`); its data-anim attribute picks the
 * animation. */
export const petEl = document.getElementById("pet");

/** The full-spritesheet element (`#sheet`) inside the viewport; animations
 * slide it via transform, species swaps change its background image. */
export const sheetEl = document.getElementById("sheet");

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
export const DEFAULT_SETTINGS = { scale: 0.6, allDesktops: true };

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

/** Below this energy percent the pet begs for food (sprite row 6) instead of
 * idling; matches LOW_LINE's tier. */
export const BEG_ENERGY_BELOW = LOW_LINE;

/** Below this energy percent the pet curls up asleep (sprite row 10) —
 * matches the red "critical" tier in panel/barLevels.js. */
export const SLEEP_ENERGY_BELOW = 15;

/** Local hours treated as night: sleepy naps join the idle-variant pool. */
export const NIGHT_START_HOUR = 22;
export const NIGHT_END_HOUR = 7;

/** After this long without the user touching the pet, sleepy naps join the
 * idle-variant pool (daytime "owner is away" naps). */
export const INACTIVITY_NAP_MS = 20 * 60_000;

/** Gap between two idle-variant one-shots (look/think/sleep) — deliberately
 * long so the desktop pet stays calm and non-distracting. */
export const VARIANT_GAP_MIN_MS = 60_000;
export const VARIANT_GAP_MAX_MS = 180_000;

/** The looping "resting" animations idleAnim() may pick — the ones a state
 * change is allowed to swap out immediately (one-shots and runs are not). */
export const RESTING_ANIMS = new Set(["idle", "sad", "beg", "sleep"]);

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
  government: "💖",
  pika: "🐱",
  kitchen: "🍳",
  fightclub: "🥊",
  achievements: "🏆",
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
 * - `isSad`: mood is below SAD_MOOD_BELOW (resting animation becomes "sad").
 * - `isHungry`: energy is below BEG_ENERGY_BELOW (resting becomes "beg").
 * - `isSleepy`: energy is below SLEEP_ENERGY_BELOW (resting becomes "sleep").
 * - `oneShotTimer`: timeout id reverting a one-shot animation (playOnce.js).
 * - `nextVariantAt`: earliest timestamp for the next idle-variant one-shot.
 * - `lastUserActionAt`: timestamp of the last user interaction with the pet
 *   (inactivity naps).
 * - `lastName`: pet name from the previous broadcast (rename detection).
 * - `currentSpecies`: sprite sheet currently applied.
 * - `bubbleTimer`: timeout id hiding the speech bubble.
 * - `lastComplaintAt`: timestamp of the last complaint line.
 * - `lastPressAt`: timestamp of the last mousedown (double-click detection).
 * - `lastX`: last seen window x (drag direction detection).
 * - `settleTimer`: timeout id detecting the end of a drag.
 * - `lastHitbox`: last sprite bounding box reported to the click-through
 *   watcher (see initHitbox.js).
 * - `petsDir`: absolute path of <data>/pets/ (custom-form spritesheets).
 * - `customForms`: latest known custom-form list ({key, breed, file}).
 */
export const rt = {
  animating: false,
  isSad: false,
  isHungry: false,
  isSleepy: false,
  oneShotTimer: null,
  nextVariantAt: 0,
  lastUserActionAt: Date.now(),
  lastName: null,
  currentSpecies: "toy_poodle",
  bubbleTimer: null,
  lastComplaintAt: 0,
  lastPressAt: 0,
  lastX: null,
  settleTimer: null,
  lastHitbox: "",
  petsDir: "",
  customForms: [],
};
