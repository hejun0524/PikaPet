// hub/initBridge.js — Extension bridge wiring: extension pages run in sandboxed
// iframes and talk to the app through postMessage: {reqId, type, payload} in,
// {reqId, result, error} out. (See handleExtensionRequest.js and doc/addons.md.)

import { listen } from "../shared/tauri.js";
import { extensionFrame } from "./extensionFrame.js";
import { handleExtensionRequest } from "./handleExtensionRequest.js";

/**
 * Wire the extension postMessage bridge: answer bridge requests coming from
 * extension iframes, and forward tray mini-widget button presses (relayed by the
 * stats window as "extension-widget-action") to the extension's main page.
 *
 * Side effects: adds a window "message" listener and a Tauri event listener.
 *
 * @returns {void}
 */
export function initBridge() {
  window.addEventListener("message", async (e) => {
    const frame = [...document.querySelectorAll("#extension-host iframe")].find(
      (f) => f.contentWindow === e.source
    );
    if (!frame) return;
    const { reqId, type, payload } = e.data ?? {};
    if (typeof reqId === "undefined") return;
    let result = null;
    let error = null;
    try {
      result = await handleExtensionRequest(frame.dataset.extension, type, payload);
    } catch (err) {
      error = String(err?.message ?? err);
    }
    frame.contentWindow.postMessage({ reqId, result, error }, "*");
  });

  // Buttons pressed in a tray mini-widget come back through the stats window
  // and get forwarded to the extension's main page.
  listen("extension-widget-action", ({ payload }) => {
    extensionFrame(payload.id)?.contentWindow?.postMessage(
      { type: "widget-action", payload: payload.payload },
      "*"
    );
  });
}
