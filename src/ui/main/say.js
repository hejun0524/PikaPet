// main/say.js — Speech bubble.

import { bubbleEl, rt } from "./state.js";

/**
 * Show a line of text in the pet's speech bubble, then hide it after a delay.
 *
 * Side effects: writes the bubble element's text and hidden state, replaces
 * `rt.bubbleTimer`.
 *
 * @param {string} text - The line to display.
 * @param {number} [ms=5000] - How long the bubble stays visible, in ms.
 * @returns {void}
 */
export function say(text, ms = 5000) {
  bubbleEl.textContent = text;
  bubbleEl.hidden = false;
  clearTimeout(rt.bubbleTimer);
  rt.bubbleTimer = setTimeout(() => (bubbleEl.hidden = true), ms);
}
