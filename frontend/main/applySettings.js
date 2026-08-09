// main/applySettings.js

import { LogicalSize } from "../shared/tauri.js";
import {
  petEl,
  appWindow,
  CELL_W,
  CELL_H,
  BUBBLE_SPACE,
  MIN_WINDOW_W,
  DEFAULT_SETTINGS,
} from "./state.js";
import { clampToScreen } from "./clampToScreen.js";

/**
 * Apply user settings to the pet window: scales the sprite via CSS zoom,
 * resizes the window to match (plus speech-bubble headroom), toggles
 * visible-on-all-workspaces, and clamps the window back onto the screen.
 *
 * Side effects: writes `petEl.style.zoom`, resizes and moves the window.
 *
 * @param {{scale?: number, allDesktops?: boolean}} s - Settings object;
 *   missing fields fall back to DEFAULT_SETTINGS.
 * @returns {Promise<void>}
 */
export async function applySettings(s) {
  const scale = typeof s.scale === "number" ? s.scale : DEFAULT_SETTINGS.scale;
  const allDesktops =
    typeof s.allDesktops === "boolean" ? s.allDesktops : DEFAULT_SETTINGS.allDesktops;

  petEl.style.zoom = scale;
  await appWindow.setSize(
    new LogicalSize(
      Math.max(MIN_WINDOW_W, Math.round(CELL_W * scale)),
      Math.round(CELL_H * scale) + BUBBLE_SPACE
    )
  );
  await appWindow.setVisibleOnAllWorkspaces(allDesktops);
  clampToScreen();
}
