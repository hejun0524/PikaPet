// hub/handleAddonRequest.js — Add-on bridge: add-on pages run in sandboxed
// iframes and talk to the app through postMessage: {reqId, type, payload} in,
// {reqId, result, error} out. Supported requests: pick-folder, list-music,
// file-url, say, notify, open-window, widget-set, widget-push, get-locale.
// (See doc/addons.md.)

import { invoke, convertFileSrc, emit } from "../shared/tauri.js";
import { t, getLocale } from "../shared/i18n.js";
import { state } from "./state.js";

/**
 * Handle one bridge request from an add-on iframe.
 *
 * Side effects: may invoke Rust commands (dialogs, notifications, windows)
 * and emit app events (pet-say, addon-widget-set, addon-widget-state).
 *
 * @param {string} id - The requesting add-on's id.
 * @param {string} type - Request type (see the list above).
 * @param {Object|undefined} payload - Request payload, shape varies by type.
 * @returns {Promise<*>} The request's result; rejects on unknown types or
 *   invalid payloads.
 */
export async function handleAddonRequest(id, type, payload) {
  // The app's active locale ("en", "zh", …) so add-ons can render their own
  // pages in the user's language. Changes arrive as an "app-locale" message.
  if (type === "get-locale") {
    return getLocale();
  }
  if (type === "pick-folder") {
    return invoke("plugin:dialog|open", {
      options: { title: t("dialog.pickFolder"), directory: true, multiple: false },
    });
  }
  if (type === "list-music") {
    return invoke("list_music", { dir: String(payload?.dir ?? "~/Music") });
  }
  if (type === "file-url") {
    return convertFileSrc(String(payload?.path ?? ""));
  }
  if (type === "say") {
    // Add-ons can't read pet data; the app fills in {callMe} / {petName}.
    const text = String(payload?.text ?? "")
      .replaceAll("{callMe}", state.callMe || "Owner")
      .replaceAll("{petName}", state.name || "your pet")
      .trim().slice(0, 200);
    if (!text) throw new Error("say: empty text");
    await emit("pet-say", { text, ms: Number(payload?.ms) || undefined });
    return true;
  }
  if (type === "notify") {
    return invoke("notify", {
      title: String(payload?.title ?? "MyPet"),
      body: String(payload?.body ?? ""),
    });
  }
  if (type === "open-window") {
    return invoke("open_addon_window", {
      id,
      page: String(payload?.page ?? ""),
      width: Number(payload?.width) || 480,
      height: Number(payload?.height) || 360,
      title: String(payload?.title ?? ""),
    });
  }
  if (type === "widget-set") {
    await emit("addon-widget-set", { id, on: !!payload?.on });
    return true;
  }
  if (type === "widget-push") {
    await emit("addon-widget-state", { id, state: payload?.state ?? null });
    return true;
  }
  throw new Error(`unknown bridge request: ${type}`);
}
