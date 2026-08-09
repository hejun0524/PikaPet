// adventure/advTokensHTML.js

import { adv } from "./state.js";

/**
 * Render the current Finnies balance as "1,234 🐟".
 *
 * @returns {string} HTML/text snippet showing the token balance.
 */
export function advTokensHTML() {
  return `${adv.tokens.toLocaleString()} 🐟`;
}
