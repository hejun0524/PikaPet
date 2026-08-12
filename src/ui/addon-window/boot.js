// addon-window/boot.js

import { convertFileSrc, invoke } from "../shared/tauri.js";
import { setLanguage } from "../shared/i18n.js";
import { extensionId, extensionPage } from "./params.js";

/**
 * Load the requested extension page: verify the extension is installed, then mount
 * its page in a sandboxed iframe. On any failure the window shows an error
 * note instead.
 *
 * @returns {Promise<void>} Resolves once the iframe is mounted (or the error
 *   note rendered).
 */
export async function boot() {
  try {
    // Pick up the saved language so bridge dialogs match the app.
    const raw = await invoke("load_state");
    if (raw) setLanguage(JSON.parse(raw).settings?.language);
  } catch {
    // First run / unreadable save: stay on the system language.
  }
  try {
    const installed = await invoke("list_installed_extensions");
    const extension = installed.find((a) => a.id === extensionId);
    if (!extension?.dir || !extensionPage) throw new Error("extension not installed");
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.src = convertFileSrc(`${extension.dir}/${extensionPage}`);
    document.body.appendChild(frame);
  } catch (e) {
    document.body.innerHTML = `<div class="err">Could not load this extension page 😿<br/>${String(e)}</div>`;
  }
}
