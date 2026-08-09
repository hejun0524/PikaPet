// hub/addonFrame.js — Add-on bridge: add-on pages run in sandboxed iframes
// inside #addon-host (see handleAddonRequest.js and doc/addons.md).

/**
 * Find the live iframe of an installed add-on, if it has been opened.
 *
 * @param {string} id - Add-on id (the iframe's data-addon value).
 * @returns {HTMLIFrameElement|undefined} The iframe, or undefined.
 */
export function addonFrame(id) {
  return [...document.querySelectorAll("#addon-host iframe")].find(
    (f) => f.dataset.addon === id
  );
}
