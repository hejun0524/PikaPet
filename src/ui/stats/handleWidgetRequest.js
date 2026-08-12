// stats/handleWidgetRequest.js — Widget bridge: tray mini-widget pages get a
// small subset of the extension bridge (see doc/addons.md), served right here in
// the stats window — so a widget works even when its extension's hub page has
// never been opened this run (e.g. Caffeine's tray toggle).

import { invoke } from "../shared/tauri.js";
import { getLocale } from "../shared/i18n.js";

/**
 * Serve one postMessage bridge request from a tray widget iframe. Only the
 * self-contained requests are allowed here — anything that talks to the
 * extension's main page still goes through widget-action.
 *
 * @param {string} type - Request type: "get-locale" | "keep-awake" |
 *   "keep-awake-status" | "notify".
 * @param {Object|undefined} payload - Request payload, shape varies by type.
 * @returns {Promise<*>} The request's result; rejects on unknown types.
 */
export async function handleWidgetRequest(type, payload) {
  if (type === "get-locale") {
    return getLocale();
  }
  if (type === "keep-awake") {
    return invoke("set_keep_awake", { on: !!payload?.on });
  }
  if (type === "keep-awake-status") {
    return invoke("keep_awake_status");
  }
  if (type === "notify") {
    return invoke("notify", {
      title: String(payload?.title ?? "MyPet"),
      body: String(payload?.body ?? ""),
    });
  }
  throw new Error(`unknown widget bridge request: ${type}`);
}
