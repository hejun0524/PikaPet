// main/applySettings.js

import { LogicalSize } from "../shared/tauri.js";
import {
  petEl,
  scalerEl,
  appWindow,
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
 * @param {{scale?: number, allDesktops?: boolean}} s - Settings object;
 *   missing fields fall back to DEFAULT_SETTINGS.
 * @returns {Promise<void>}
 */
export async function applySettings(s) {
  const scale = typeof s.scale === "number" ? s.scale : DEFAULT_SETTINGS.scale;
  const allDesktops =
    typeof s.allDesktops === "boolean" ? s.allDesktops : DEFAULT_SETTINGS.allDesktops;

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
