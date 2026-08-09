// main/boot.js — Apply persisted settings on boot, then follow live changes
// from the settings window (registered in initEvents.js).

import { invoke, currentMonitor } from "../shared/tauri.js";
import { setLanguage } from "../shared/i18n.js";
import { appWindow, latest, trip } from "./state.js";
import { applySettings } from "./applySettings.js";
import { applySpecies } from "./applySpecies.js";
import { updateMood } from "./updateMood.js";
import { greet } from "./greet.js";

/**
 * Boot the pet window from the persisted save: apply settings and species,
 * restore the owner name and mood, note the active activity/caretaking, and
 * either start hidden (app launched mid-tour) or greet the owner shortly
 * after launch.
 *
 * Side effects: invokes "load_state", resizes/moves and possibly hides the
 * window, mutates `latest` and `trip`, writes the DOM, may show the speech
 * bubble.
 *
 * @returns {Promise<void>}
 */
export async function boot() {
  let saved = {};
  try {
    const raw = await invoke("load_state");
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.error("failed to load settings:", e);
  }
  setLanguage(saved.settings?.language);
  applySettings(saved.settings ?? {});
  applySpecies(saved.species);
  if (typeof saved.callMe === "string" && saved.callMe.trim()) {
    latest.callMe = saved.callMe.trim();
  }
  // Old saves may still call mood "happiness".
  updateMood(saved.care?.mood ?? saved.care?.happiness);
  latest.activity = saved.activity?.active ?? null;
  latest.caretaking = saved.caretaking?.active ?? null;
  // If the app starts mid-trip, the pet is already away: hide without fanfare.
  if (saved.activity?.active?.type === "tour") {
    trip.monitor = await currentMonitor();
    trip.homePos = await appWindow.outerPosition();
    trip.size = await appWindow.outerSize();
    trip.away = true;
    await appWindow.hide();
  } else {
    setTimeout(greet, 1200);
  }
}
