// main/state.js — ALL mutable state and constants of the pet window (the
// desktop sprite): DOM handles, sprite-sheet geometry, the latest broadcast
// snapshot, and the trip/animation flags.

import { getCurrentWindow } from "../shared/tauri.js";

/** The pet sprite viewport (`#pet`); its data-anim attribute picks the
 * animation. Sized in px to CELL * scale by applySettings.js. */
export const petEl = document.getElementById("pet");

/** The pet-size scaling wrapper (`#scaler`) inside the viewport; its
 * transform: scale(...) (set by applySettings.js) composes with #sheet's
 * native-pixel animation transforms — see style.css. */
export const scalerEl = document.getElementById("scaler");

/** The full-spritesheet element (`#sheet`) inside the scaler; animations
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

/** The looping "resting" animations idleAnim() may pick — the ones a state
 * change is allowed to swap out immediately (one-shots and runs are not). */
export const RESTING_ANIMS = new Set(["idle", "sad"]);

/** Horizontal pixels per 16ms frame of the trip travel animation. */
export const TRAVEL_STEP_PX = 16;

/** Manual double-click detection window (startDragging swallows dblclick). */
export const DOUBLE_CLICK_MS = 400;

/**
 * Right-click menu views, in menu order, with their emoji. Labels come from
 * the locale files (t("view.<key>")) when the menu is built. Pika, Darcy's
 * Fight Club, Noonie's Kitchen, Dune's Daily Tasks, and Achievements are
 * reachable from the hub nav but deliberately left off this menu (kept
 * short, per user request).
 */
export const VIEW_EMOJI = {
  home: "🏠",
  shopping: "🧺",
  career: "💼",
  touring: "🗺️",
  government: "💖",
  extensions: "🧩",
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
 * - `focusMode`: mirrors settings.focusMode (set by applySettings.js) —
 *   freezes resting/complaint reactions and trims the right-click menu.
 * - `devFreeze`: mirrors settings.devFreeze (the Developer console's
 *   "pika freeze on") — freezes resting/complaint reactions the same way
 *   Focus Mode does, without any of its other UI changes.
 * - `lastSettings`: every settings field applySettings.js has seen so far,
 *   merged in as each "settings-changed" event arrives (see there for why
 *   this can't just read straight off the event payload).
 */
export const rt = {
  animating: false,
  isSad: false,
  lastName: null,
  currentSpecies: "toy_poodle",
  bubbleTimer: null,
  lastComplaintAt: 0,
  lastPressAt: 0,
  lastX: null,
  settleTimer: null,
  lastHitbox: "",
  petsDir: "",
  lastSettings: {},
  customForms: [],
  focusMode: false,
  devFreeze: false,
};
