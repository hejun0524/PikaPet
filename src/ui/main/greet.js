// main/greet.js

import { t } from "../shared/i18n.js";
import { latest } from "./state.js";
import { say } from "./say.js";
import { playOnce } from "./playOnce.js";

/**
 * Greet the owner with a wave and a time-of-day appropriate line ("Good
 * morning/afternoon/evening, <callMe>!").
 *
 * Side effects: shows the speech bubble, plays the wave animation.
 *
 * @returns {void}
 */
export function greet() {
  const hour = new Date().getHours();
  const key = hour < 12 ? "bubble.morning" : hour < 18 ? "bubble.afternoon" : "bubble.evening";
  say(t(key, { callMe: latest.callMe }));
  playOnce("wave", 2500);
}
