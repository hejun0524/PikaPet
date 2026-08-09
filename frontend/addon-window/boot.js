// addon-window/boot.js

import { convertFileSrc, invoke } from "../shared/tauri.js";
import { addonId, addonPage } from "./params.js";

/**
 * Load the requested add-on page: verify the add-on is installed, then mount
 * its page in a sandboxed iframe. On any failure the window shows an error
 * note instead.
 *
 * @returns {Promise<void>} Resolves once the iframe is mounted (or the error
 *   note rendered).
 */
export async function boot() {
  try {
    const installed = await invoke("list_installed_addons");
    const addon = installed.find((a) => a.id === addonId);
    if (!addon?.dir || !addonPage) throw new Error("add-on not installed");
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.src = convertFileSrc(`${addon.dir}/${addonPage}`);
    document.body.appendChild(frame);
  } catch (e) {
    document.body.innerHTML = `<div class="err">Could not load this add-on page 😿<br/>${String(e)}</div>`;
  }
}
