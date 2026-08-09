// main/openHub.js

import { emit, invoke } from "../shared/tauri.js";

/**
 * Open the hub window on a given view: broadcasts the view choice as a
 * "hub-view" event and asks the Rust side to show the hub window.
 *
 * Side effects: emits "hub-view", invokes "show_window".
 *
 * @param {string} view - Hub view id (e.g. "home", "settings", "touring").
 * @returns {void}
 */
export function openHub(view) {
  emit("hub-view", { view });
  invoke("show_window", { label: "hub" });
}
