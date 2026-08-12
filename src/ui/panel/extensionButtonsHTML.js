// panel/extensionButtonsHTML.js

import { escText } from "./escText.js";

/**
 * Render one quick-launch button per extension, for the popover and the hub
 * side panel.
 *
 * @param {Array<{id: string, emoji: string, name: string}>} extensions -
 *   Display-ready extension entries (see items/extensionList.js).
 * @param {string|null} [activeId] - Extension id whose page is currently open;
 *   its button gets the "active" class (hub only).
 * @returns {string} HTML: a `<button class="extension-btn" data-extension="…">` per
 *   extension.
 */
export function extensionButtonsHTML(extensions, activeId) {
  return extensions
    .map(
      (a) => `<button class="extension-btn${a.id === activeId ? " active" : ""}" data-extension="${escText(a.id)}" title="${escText(a.name)}">${escText(a.emoji)}</button>`
    )
    .join("");
}
