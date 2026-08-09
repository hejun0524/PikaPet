// stats/save.js — Persistence (save.json in the app data dir, via Rust
// commands). On a first run (no save file), nothing is written until the
// setup window finishes — quitting mid-setup keeps the app in the first-run
// state (see runtime.saveEnabled).

import { invoke } from "../shared/tauri.js";
import { pet, runtime } from "./state.js";

/**
 * Serialize the pet's state and persist it to save.json via the Rust
 * `save_state` command. No-op while `runtime.saveEnabled` is false.
 * Side effects: fires an async invoke (write failures only logged).
 *
 * @returns {void}
 */
export function save() {
  if (!runtime.saveEnabled) return;
  const a = pet.activity.active;
  const state = {
    name: pet.name,
    species: pet.species,
    forms: pet.forms,
    callMe: pet.callMe,
    coins: pet.coins,
    achievements: pet.achievements,
    settings: pet.settings,
    care: Object.fromEntries(pet.care.map((s) => [s.key, s.value])),
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    bag: pet.bag,
    school: { subjects: pet.school.subjects },
    career: { xp: pet.career.xp },
    touring: pet.touring,
    souvenirs: pet.souvenirs,
    tickets: pet.tickets,
    pika: pet.pika,
    bank: pet.bank,
    homework: pet.homework,
    pinnedAddons: pet.pinnedAddons,
    activity: {
      plan: [...pet.activity.plan],
      // Persist elapsed time, not wall-clock, so a closed app pauses activities.
      active: a
        ? { type: a.type, key: a.key, durationMs: a.durationMs, elapsedMs: Date.now() - a.startedAt }
        : null,
    },
    caretaking: {
      plan: [...pet.caretaking.plan],
      active: pet.caretaking.active
        ? {
            key: pet.caretaking.active.key,
            durationMs: pet.caretaking.active.durationMs,
            elapsedMs: Date.now() - pet.caretaking.active.startedAt,
          }
        : null,
    },
    window: pet.window,
  };
  invoke("save_state", { state: JSON.stringify(state, null, 2) }).catch((e) =>
    console.error("save failed:", e)
  );
}
