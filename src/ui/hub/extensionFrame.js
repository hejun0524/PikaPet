// hub/extensionFrame.js — Extension bridge: extension pages run in sandboxed iframes
// inside #extension-host (see handleExtensionRequest.js and doc/addons.md).

/**
 * Find the live iframe of an installed extension, if it has been opened.
 *
 * @param {string} id - Extension id (the iframe's data-extension value).
 * @returns {HTMLIFrameElement|undefined} The iframe, or undefined.
 */
export function extensionFrame(id) {
  return [...document.querySelectorAll("#extension-host iframe")].find(
    (f) => f.dataset.extension === id
  );
}
