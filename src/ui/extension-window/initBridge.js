// extension-window/initBridge.js

import { handleRequest } from "./handleRequest.js";

/**
 * Attach the postMessage bridge: requests `{reqId, type, payload}` from the
 * hosted iframe are answered with `{reqId, result, error}` (see doc/extensions.md).
 * Messages from any other source, or without a reqId, are ignored.
 *
 * @returns {void} Registers the window "message" listener; call once at
 *   startup.
 */
export function initBridge() {
  window.addEventListener("message", async (e) => {
    const frame = document.querySelector("iframe");
    if (!frame || e.source !== frame.contentWindow) return;
    const { reqId, type, payload } = e.data ?? {};
    if (typeof reqId === "undefined") return;
    let result = null;
    let error = null;
    try {
      result = await handleRequest(type, payload);
    } catch (err) {
      error = String(err?.message ?? err);
    }
    frame.contentWindow.postMessage({ reqId, result, error }, "*");
  });
}
