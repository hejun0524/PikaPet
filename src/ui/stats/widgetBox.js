// stats/widgetBox.js — Extension tray widgets: extensions with a "widget" page in
// their manifest can hang a mini rounded box below this popover (a mini
// music player, a status readout…). Boxes stack in the order their
// extensions turned them on; the window grows to fit.
// Protocol (see doc/extensions.md): the extension's main page sends widget-set / a
// widget-push state; the widget page answers with widget-ready and sends
// widget-action, which we relay back to the main page via a Tauri event.

/**
 * Find the widget box element belonging to one extension. No side effects.
 *
 * @param {string} id - Extension id.
 * @returns {HTMLElement|undefined} The ".widget-box" element, or undefined
 *   if that extension has no widget showing.
 */
export function widgetBox(id) {
  return [...document.querySelectorAll(".widget-box")].find(
    (b) => b.dataset.extension === id
  );
}
