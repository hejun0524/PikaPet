// main/initHitbox.js — reports the pet sprite's bounding box to Rust so the
// click-through watcher (main.rs spawn_click_through_watcher) can let mouse
// events pass through the window's transparent margins. Re-reported whenever
// it changes (scale, species, bubble show/hide all shift the layout).

import { invoke } from "../shared/tauri.js";
import { petEl, rt } from "./state.js";

/** Extra grab margin around the sprite, in logical px. */
const HITBOX_PAD = 8;

/**
 * Start the 500ms hitbox reporter. Cheap: it only invokes Rust when the
 * rect actually changed.
 *
 * Side effects: installs a setInterval; updates rt.lastHitbox; invokes
 * "set_pet_hitbox".
 *
 * @returns {void}
 */
export function initHitbox() {
  const report = () => {
    const r = petEl.getBoundingClientRect();
    if (!r.width || !r.height) return; // hidden mid-trip; keep the old box
    const box = {
      x: Math.round(r.left - HITBOX_PAD),
      y: Math.round(r.top - HITBOX_PAD),
      w: Math.round(r.width + HITBOX_PAD * 2),
      h: Math.round(r.height + HITBOX_PAD * 2),
    };
    const key = `${box.x},${box.y},${box.w},${box.h}`;
    if (key === rt.lastHitbox) return;
    rt.lastHitbox = key;
    invoke("set_pet_hitbox", box).catch((e) => console.error("set_pet_hitbox failed:", e));
  };
  report();
  setInterval(report, 500);
}
