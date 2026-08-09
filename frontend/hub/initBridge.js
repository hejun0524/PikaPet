// hub/initBridge.js — Add-on bridge wiring: add-on pages run in sandboxed
// iframes and talk to the app through postMessage: {reqId, type, payload} in,
// {reqId, result, error} out. (See handleAddonRequest.js and ADDONS.md.)

import { listen } from "../shared/tauri.js";
import { addonFrame } from "./addonFrame.js";
import { handleAddonRequest } from "./handleAddonRequest.js";

/**
 * Wire the add-on postMessage bridge: answer bridge requests coming from
 * add-on iframes, and forward tray mini-widget button presses (relayed by the
 * stats window as "addon-widget-action") to the add-on's main page.
 *
 * Side effects: adds a window "message" listener and a Tauri event listener.
 *
 * @returns {void}
 */
export function initBridge() {
  window.addEventListener("message", async (e) => {
    const frame = [...document.querySelectorAll("#addon-host iframe")].find(
      (f) => f.contentWindow === e.source
    );
    if (!frame) return;
    const { reqId, type, payload } = e.data ?? {};
    if (typeof reqId === "undefined") return;
    let result = null;
    let error = null;
    try {
      result = await handleAddonRequest(frame.dataset.addon, type, payload);
    } catch (err) {
      error = String(err?.message ?? err);
    }
    frame.contentWindow.postMessage({ reqId, result, error }, "*");
  });

  // Buttons pressed in a tray mini-widget come back through the stats window
  // and get forwarded to the add-on's main page.
  listen("addon-widget-action", ({ payload }) => {
    addonFrame(payload.id)?.contentWindow?.postMessage(
      { type: "widget-action", payload: payload.payload },
      "*"
    );
  });
}
