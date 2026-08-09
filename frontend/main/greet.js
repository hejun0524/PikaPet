// main/greet.js

import { latest } from "./state.js";
import { say } from "./say.js";

/**
 * Greet the owner with a time-of-day appropriate line ("Good morning/
 * afternoon/evening, <callMe>!").
 *
 * Side effects: shows the speech bubble.
 *
 * @returns {void}
 */
export function greet() {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  say(`Good ${period}, ${latest.callMe}!`);
}
