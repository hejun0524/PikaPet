// stats/widgetBox.js — Add-on tray widgets: add-ons with a "widget" page in
// their manifest can hang a mini rounded box below this popover (a mini
// music player, a status readout…). Boxes stack in the order their
// add-ons turned them on; the window grows to fit.
// Protocol (see doc/addons.md): the add-on's main page sends widget-set / a
// widget-push state; the widget page answers with widget-ready and sends
// widget-action, which we relay back to the main page via a Tauri event.

/**
 * Find the widget box element belonging to one add-on. No side effects.
 *
 * @param {string} id - Add-on id.
 * @returns {HTMLElement|undefined} The ".widget-box" element, or undefined
 *   if that add-on has no widget showing.
 */
export function widgetBox(id) {
  return [...document.querySelectorAll(".widget-box")].find(
    (b) => b.dataset.addon === id
  );
}
