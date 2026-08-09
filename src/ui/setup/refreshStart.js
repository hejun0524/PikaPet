// setup/refreshStart.js

/**
 * Enable/disable the Start button: starting requires a non-empty pet name.
 *
 * @returns {void} Updates `#setup-start`'s disabled state.
 */
export function refreshStart() {
  document.getElementById("setup-start").disabled =
    !document.getElementById("setup-name").value.trim();
}
