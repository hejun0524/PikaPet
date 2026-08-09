// panel/addonButtonsHTML.js

import { escText } from "./escText.js";

/**
 * Render one quick-launch button per add-on, for the popover and the hub
 * side panel.
 *
 * @param {Array<{id: string, emoji: string, name: string}>} addons -
 *   Display-ready add-on entries (see items/addonList.js).
 * @param {string|null} [activeId] - Add-on id whose page is currently open;
 *   its button gets the "active" class (hub only).
 * @returns {string} HTML: a `<button class="addon-btn" data-addon="…">` per
 *   add-on.
 */
export function addonButtonsHTML(addons, activeId) {
  return addons
    .map(
      (a) => `<button class="addon-btn${a.id === activeId ? " active" : ""}" data-addon="${escText(a.id)}" title="${escText(a.name)}">${escText(a.emoji)}</button>`
    )
    .join("");
}
