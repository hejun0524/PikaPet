// hub/initWidgetActionRelay.js — a tray widget's button presses come back
// through the stats window as "extension-widget-action"; relay them into
// the extension's own child webview via a targeted push (see
// doc/extensions.md and extensions::bridge::ext_push). Replaces the old
// initBridge.js relay, which forwarded via `contentWindow.postMessage` —
// not possible once the extension is a separate child webview rather than
// a same-page iframe.

import { invoke, listen } from "../shared/tauri.js";

/**
 * Wire the widget-action relay.
 *
 * @returns {void}
 */
export function initWidgetActionRelay() {
  listen("extension-widget-action", ({ payload }) => {
    invoke("ext_push", {
      id: payload.id,
      kind: "widget-action",
      data: { payload: payload.payload },
    }).catch(() => {});
  });
}
