// main/initIdleVariety.js — occasional idle-variant one-shots. The design
// goal is a CALM desktop pet: it rests in plain idle almost all the time and
// only rarely (VARIANT_GAP_* apart) plays a few seconds of something else,
// so it never becomes a distraction while the user works.

import {
  petEl,
  latest,
  trip,
  rt,
  NIGHT_START_HOUR,
  NIGHT_END_HOUR,
  INACTIVITY_NAP_MS,
  VARIANT_GAP_MIN_MS,
  VARIANT_GAP_MAX_MS,
} from "./state.js";
import { playOnce } from "./playOnce.js";

/** How long each variant plays, in ms (naps linger, glances are short). */
const VARIANT_MS = { "look-right": 5000, "look-left": 5000, think: 7000, sleep: 14000 };

/** How often eligibility is re-checked. */
const CHECK_MS = 5000;

/**
 * Start the idle-variety clock. Every CHECK_MS it may play one variant, only
 * when the pet is showing PLAIN idle (never over sad/beg/sleep resting
 * states, runs, or another one-shot) and the random gap has elapsed:
 * - "look-right"/"look-left" (look around) — always in the pool.
 * - "think" — while an activity or caretaker shift is running, weighted
 *   heavier: a busy pet still looks idle, occasionally pondering its work.
 * - "sleep" (a short nap) — at night, or after INACTIVITY_NAP_MS without the
 *   user touching the pet; weighted heavier at night. (Critically low energy
 *   instead makes "sleep" the persistent resting state — see idleAnim.js.)
 *
 * Side effects: registers an interval; ticks update `rt.nextVariantAt` and
 * may play a one-shot animation.
 *
 * @returns {void}
 */
export function initIdleVariety() {
  rt.nextVariantAt = Date.now() + randomGap();
  setInterval(() => {
    const now = Date.now();
    if (now < rt.nextVariantAt) return;
    if (trip.away || rt.animating) return;
    if (petEl.dataset.anim !== "idle") return;

    const pool = ["look-right", "look-left"];
    if (latest.activity || latest.caretaking) pool.push("think", "think", "think");
    const hour = new Date().getHours();
    if (hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR) {
      pool.push("sleep", "sleep");
    } else if (now - rt.lastUserActionAt > INACTIVITY_NAP_MS) {
      pool.push("sleep");
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    playOnce(pick, VARIANT_MS[pick]);
    rt.nextVariantAt = now + randomGap();
  }, CHECK_MS);
}

/** @returns {number} A uniform random gap between the VARIANT_GAP_* bounds. */
function randomGap() {
  return VARIANT_GAP_MIN_MS + Math.random() * (VARIANT_GAP_MAX_MS - VARIANT_GAP_MIN_MS);
}
