// stats/openHub.js

import { emit, invoke } from "../shared/tauri.js";

/**
 * Open the hub window on a given view: broadcast "hub-view" (the hub
 * switches pages) and ask Rust to show the hub window.
 * Side effects: broadcasts a Tauri event and fires an async invoke.
 *
 * @param {string} view - Hub view id (e.g. "home", "settings", "addon:<id>").
 * @returns {void}
 */
export function openHub(view) {
  emit("hub-view", { view });
  invoke("show_window", { label: "hub" });
}
