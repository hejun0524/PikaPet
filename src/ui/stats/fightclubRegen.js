// stats/fightclubRegen.js — fight-HP recovery on the 1-second master clock:
// after a battle the pet heals 1.5% of max fight HP per game-minute (dev
// mode speeds this up like everything else). Recovery pauses while the app
// is closed, matching the activity-timer philosophy.

import { schoolMinuteMs } from "../school.js";
import { maxHpFor } from "../fightclub.js";
import { pet, runtime } from "./state.js";
import { traitOf } from "./traitOf.js";

/** Fraction of max fight HP recovered per game-minute. */
const REGEN_PER_MINUTE = 0.015;

/**
 * Apply any whole game-minutes of fight-HP regeneration since the last
 * tick. Side effects: mutates pet.fightclub.hp and runtime.lastFcRegenAt.
 *
 * @returns {boolean} True if HP changed (callers render/save/broadcast).
 */
export function fightclubRegen() {
  const max = maxHpFor(pet.fightclub.level, traitOf("fitness")?.value ?? 0);
  if (pet.fightclub.hp >= max) {
    runtime.lastFcRegenAt = Date.now();
    return false;
  }
  const minuteMs = schoolMinuteMs(pet.settings.devMode);
  const minutes = Math.floor((Date.now() - runtime.lastFcRegenAt) / minuteMs);
  if (minutes < 1) return false;
  runtime.lastFcRegenAt += minutes * minuteMs;
  pet.fightclub.hp = Math.min(max, pet.fightclub.hp + Math.ceil(max * REGEN_PER_MINUTE) * minutes);
  return true;
}
