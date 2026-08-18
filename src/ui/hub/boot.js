// hub/boot.js

import { invoke, getCurrentWindow, LogicalSize } from "../shared/tauri.js";
import { getLocale } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { applyState } from "./applyState.js";
import { renderAll } from "./renderAll.js";

/**
 * Initial state from the save file (live broadcasts take over afterwards):
 * scan installed extensions, load and apply save.json, then paint everything.
 *
 * Side effects: mutates `state`, logs failures to the console, and calls
 * renderAll().
 *
 * @returns {Promise<void>}
 */
export async function boot() {
  try {
    state.extensionsInstalled = await invoke("list_installed_extensions");
  } catch (e) {
    console.error("extension scan failed:", e);
  }
  try {
    const raw = await invoke("load_state");
    if (raw) applyState(JSON.parse(raw));
  } catch (e) {
    console.error("failed to load hub state:", e);
  }
  // Rust has no locale concept of its own (it was purely JS state before
  // extensions became real child webviews) — mirror it so `ext_get_locale`
  // has something to answer.
  invoke("set_current_locale", { locale: getLocale() }).catch(() => {});
  try {
    // Settings → Storage shows these; custom pet thumbs resolve against pets.
    ui.dataPaths = await invoke("get_data_paths");
  } catch (e) {
    console.error("get_data_paths failed:", e);
  }
  renderAll();

  // Starting collapsed: shrink the window by the rail delta so the content
  // panel is the same size it would be in an expanded session (the toggle
  // handler in initEvents.js keeps this invariant afterwards).
  if (document.getElementById("layout").classList.contains("collapsed")) {
    const saved = Number(localStorage.getItem("sideWidth"));
    const expanded = saved >= 240 && saved <= 460 ? saved : 280;
    const delta = expanded + 5 - document.getElementById("side").offsetWidth; // +5 = splitter
    if (delta > 0) {
      getCurrentWindow()
        .setSize(new LogicalSize(window.innerWidth - delta, window.innerHeight))
        .catch((e) => console.error("collapsed boot resize failed:", e));
    }
  }
}
