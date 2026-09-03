// main/applySettings.js

import { LogicalSize } from "../shared/tauri.js";
import {
  petEl,
  scalerEl,
  appWindow,
  rt,
  CELL_W,
  CELL_H,
  BUBBLE_SPACE,
  MIN_WINDOW_W,
  DEFAULT_SETTINGS,
} from "./state.js";
import { clampToScreen } from "./clampToScreen.js";

/**
 * Apply user settings to the pet window: sizes the sprite viewport in px and
 * scales it via a standard CSS transform (deliberately not the non-standard
 * `zoom` property — some older WebKit builds handle it inconsistently at
 * small values, which has been observed breaking the click-through hitbox
 * math in initHitbox.js), resizes the window to match (plus speech-bubble
 * headroom), toggles visible-on-all-workspaces, and clamps the window back
 * onto the screen.
 *
 * Side effects: writes petEl/scalerEl inline styles, resizes and moves the
 * window.
 *
 * @param {{scale?: number, allDesktops?: boolean, focusMode?: boolean}} s -
 *   Settings fields to apply. `s` is merged onto every field seen in a
 *   previous call (`rt.lastSettings`) before reading anything out of it —
 *   most callers pass the full settings object, but the pet's own
 *   right-click "Focus Mode" toggle emits just `{focusMode}`, and treating
 *   *that* as "everything else is unset" would snap scale/allDesktops back
 *   to DEFAULT_SETTINGS instead of leaving them alone. Only truly-never-set
 *   fields (nothing yet in `rt.lastSettings`, i.e. first boot before
 *   save.json is read) fall back to DEFAULT_SETTINGS (or, for focusMode,
 *   false).
 * @returns {Promise<void>}
 */
export async function applySettings(s) {
  rt.lastSettings = { ...rt.lastSettings, ...s };
  const merged = rt.lastSettings;
  const scale = typeof merged.scale === "number" ? merged.scale : DEFAULT_SETTINGS.scale;
  const allDesktops =
    typeof merged.allDesktops === "boolean" ? merged.allDesktops : DEFAULT_SETTINGS.allDesktops;
  rt.focusMode = typeof merged.focusMode === "boolean" ? merged.focusMode : false;
  rt.devFreeze = typeof merged.devFreeze === "boolean" ? merged.devFreeze : false;

  petEl.style.width = `${Math.round(CELL_W * scale)}px`;
  petEl.style.height = `${Math.round(CELL_H * scale)}px`;
  scalerEl.style.transform = `scale(${scale})`;
  await appWindow.setSize(
    new LogicalSize(
      Math.max(MIN_WINDOW_W, Math.round(CELL_W * scale)),
      Math.round(CELL_H * scale) + BUBBLE_SPACE
    )
  );
  await appWindow.setVisibleOnAllWorkspaces(allDesktops);
  clampToScreen();
}
