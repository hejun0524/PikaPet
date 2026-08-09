// stats/load.js — Persistence: restore pet state from save.json (via the
// Rust `load_state` command), validating every field against the current
// catalogs and accepting legacy formats.

import { invoke } from "../shared/tauri.js";
import { SPECIES, findCaretaker } from "../items.js";
import { ALL_CITIES, ALL_PLACES, findTour, ticketOfferKey } from "../touring.js";
import { LEGACY_CARE_KEYS, pet, runtime } from "./state.js";
import { activityDef } from "./activityDef.js";
import { backfillAchievements } from "./backfillAchievements.js";
import { migrateLegacySchool } from "./migrateLegacySchool.js";
import { jlog } from "./jlog.js";

/**
 * Load and validate the saved state into `pet`. On a first run (no save
 * file) sets `runtime.saveEnabled = false` so nothing is written until the
 * setup window finishes. Runs the legacy-school migration and the
 * achievements backfill. Load errors are logged and leave the defaults.
 * Side effects: mutates pet and runtime.saveEnabled; logs via jlog.
 *
 * @returns {Promise<void>}
 */
export async function load() {
  try {
    const raw = await invoke("load_state");
    if (!raw) {
      runtime.saveEnabled = false; // first run: wait for the setup window
      return;
    }
    const saved = JSON.parse(raw);
    if (typeof saved.name === "string" && saved.name.trim()) pet.name = saved.name.trim();
    if (SPECIES.some((s) => s.key === saved.species)) pet.species = saved.species;
    if (Array.isArray(saved.forms)) {
      pet.forms = saved.forms.filter((k) => SPECIES.some((s) => s.key === k));
    }
    if (!pet.forms.includes(pet.species)) pet.forms.push(pet.species);
    if (typeof saved.callMe === "string" && saved.callMe.trim()) pet.callMe = saved.callMe.trim();
    if (typeof saved.coins === "number") pet.coins = saved.coins;
    if (Array.isArray(saved.achievements)) pet.achievements = saved.achievements;
    if (saved.settings && typeof saved.settings === "object") {
      pet.settings = { ...pet.settings, ...saved.settings };
    }
    for (const s of pet.care) {
      const v = saved.care?.[s.key] ?? saved.care?.[LEGACY_CARE_KEYS[s.key]];
      if (typeof v === "number") s.value = Math.min(Math.max(v, 0), s.max);
    }
    for (const t of pet.traits) {
      const v = saved.traits?.[t.key];
      if (typeof v === "number") t.value = v;
    }
    for (const key of Object.keys(pet.bag)) {
      const v = saved.bag?.[key];
      if (typeof v === "number") pet.bag[key] = Math.max(0, Math.floor(v));
    }

    if (saved.school && typeof saved.school.stage === "string") {
      migrateLegacySchool(saved.school); // old one-track format
    } else if (saved.school?.subjects) {
      for (const key of Object.keys(pet.school.subjects)) {
        const s = saved.school.subjects[key];
        if (s && typeof s.years === "number" && typeof s.credits === "number") {
          pet.school.subjects[key] = { years: s.years, credits: s.credits };
        }
      }
    }
    backfillAchievements();

    if (saved.career?.xp) {
      for (const key of Object.keys(pet.career.xp)) {
        if (typeof saved.career.xp[key] === "number") pet.career.xp[key] = saved.career.xp[key];
      }
    }

    if (saved.touring) {
      for (const dest of ALL_PLACES) {
        const v = saved.touring.visited?.[dest.key];
        if (Array.isArray(v)) {
          pet.touring.visited[dest.key] = v.filter((c) => dest.cities.includes(c));
        }
      }
      if (Array.isArray(saved.touring.journals)) pet.touring.journals = saved.touring.journals;
    }
    if (saved.souvenirs && typeof saved.souvenirs === "object") {
      for (const [city, count] of Object.entries(saved.souvenirs)) {
        if (ALL_CITIES.includes(city) && typeof count === "number") {
          pet.souvenirs[city] = Math.max(0, Math.floor(count));
        }
      }
    }
    if (saved.tickets && typeof saved.tickets === "object") {
      for (const [key, count] of Object.entries(saved.tickets)) {
        if (findTour(key)?.ticket && typeof count === "number") {
          pet.tickets[key] = Math.max(0, Math.floor(count));
        }
      }
    }
    if (saved.pika && typeof saved.pika === "object") {
      // A save from before ticket sales existed forces a one-time re-roll.
      const hasSells = Array.isArray(saved.pika.sells);
      pet.pika = {
        date: hasSells && typeof saved.pika.date === "string" ? saved.pika.date : "",
        wants: Array.isArray(saved.pika.wants)
          ? saved.pika.wants.filter((c) => ALL_CITIES.includes(c))
          : [],
        sells: hasSells
          ? saved.pika.sells
              .filter((o) => findTour(ticketOfferKey(o)) && typeof o.price === "number")
              .map((o, i) => ({ id: `legacy#${i}`, ...o }))
          : [],
      };
    }

    if (saved.activity) {
      if (Array.isArray(saved.activity.plan)) {
        pet.activity.plan = saved.activity.plan.filter((e) => activityDef(e));
      }
      const a = saved.activity.active;
      if (a && activityDef(a) && typeof a.durationMs === "number") {
        pet.activity.active = {
          type: a.type,
          key: a.key,
          durationMs: a.durationMs,
          startedAt: Date.now() - Math.max(0, a.elapsedMs ?? 0),
        };
      }
    }

    if (saved.caretaking) {
      if (Array.isArray(saved.caretaking.plan)) {
        pet.caretaking.plan = saved.caretaking.plan.filter((k) => findCaretaker(k));
      }
      const c = saved.caretaking.active;
      if (c && findCaretaker(c.key) && typeof c.durationMs === "number") {
        pet.caretaking.active = {
          key: c.key,
          durationMs: c.durationMs,
          startedAt: Date.now() - Math.max(0, c.elapsedMs ?? 0),
        };
      }
    }
    if (
      saved.window &&
      typeof saved.window.x === "number" &&
      typeof saved.window.y === "number"
    ) {
      pet.window = { x: saved.window.x, y: saved.window.y };
    }
    if (saved.bank && typeof saved.bank === "object") {
      pet.bank = {
        savings: Math.max(0, Math.floor(saved.bank.savings ?? 0)),
        loan: Math.max(0, Math.floor(saved.bank.loan ?? 0)),
        date: typeof saved.bank.date === "string" ? saved.bank.date : "",
      };
    }
    if (Array.isArray(saved.pinnedAddons)) {
      pet.pinnedAddons = saved.pinnedAddons.filter((id) => typeof id === "string");
    }
    if (saved.homework && typeof saved.homework === "object") {
      pet.homework = {
        date: typeof saved.homework.date === "string" ? saved.homework.date : "",
        count: Math.max(0, Math.floor(saved.homework.count ?? 0)),
      };
    }
  } catch (e) {
    console.error("load failed, starting fresh:", e);
    jlog(`load failed: ${e}`);
  }
}
