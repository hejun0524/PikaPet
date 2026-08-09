// addon-window/handleRequest.js

import { convertFileSrc, emit, invoke } from "../shared/tauri.js";
import { getLocale, t } from "../shared/i18n.js";
import { addonId } from "./params.js";

/**
 * Serve one postMessage bridge request from the hosted add-on iframe — the
 * same protocol the hub serves (see doc/addons.md). Note: widget-action messages
 * are only delivered to the add-on's page in the hub, not here.
 *
 * @param {string} type - Request type: "pick-folder" | "list-music" |
 *   "file-url" | "notify" | "open-window" | "widget-set" | "widget-push".
 * @param {object|undefined} payload - Request-specific payload from the
 *   add-on.
 * @returns {Promise<*>} The request's result (dialog path, file URL, etc.);
 *   rejects with an Error for unknown request types.
 */
export async function handleRequest(type, payload) {
  // Same contract as the hub bridge: the app's active locale code.
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
  if (type === "notify") {
    return invoke("notify", {
      title: String(payload?.title ?? "MyPet"),
      body: String(payload?.body ?? ""),
    });
  }
  if (type === "open-window") {
    return invoke("open_addon_window", {
      id: addonId,
      page: String(payload?.page ?? ""),
      width: Number(payload?.width) || 480,
      height: Number(payload?.height) || 360,
      title: String(payload?.title ?? ""),
    });
  }
  if (type === "widget-set") {
    await emit("addon-widget-set", { id: addonId, on: !!payload?.on });
    return true;
  }
  if (type === "widget-push") {
    await emit("addon-widget-state", { id: addonId, state: payload?.state ?? null });
    return true;
  }
  // Keep the Mac awake (Caffeine add-on) — same contract as the hub bridge.
  if (type === "keep-awake") {
    return invoke("set_keep_awake", { on: !!payload?.on });
  }
  if (type === "keep-awake-status") {
    return invoke("keep_awake_status");
  }
  throw new Error(`unknown bridge request: ${type}`);
}
