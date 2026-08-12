// addon-window/handleRequest.js

import { convertFileSrc, emit, invoke } from "../shared/tauri.js";
import { getLocale, t } from "../shared/i18n.js";
import { extensionId } from "./params.js";

/**
 * Serve one postMessage bridge request from the hosted extension iframe — the
 * same protocol the hub serves (see doc/addons.md). Note: widget-action messages
 * are only delivered to the extension's page in the hub, not here.
 *
 * @param {string} type - Request type: "pick-folder" | "list-music" |
 *   "file-url" | "notify" | "open-window" | "widget-set" | "widget-push".
 * @param {object|undefined} payload - Request-specific payload from the
 *   extension.
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
    return invoke("open_extension_window", {
      id: extensionId,
      page: String(payload?.page ?? ""),
      width: Number(payload?.width) || 480,
      height: Number(payload?.height) || 360,
      title: String(payload?.title ?? ""),
    });
  }
  if (type === "widget-set") {
    await emit("extension-widget-set", { id: extensionId, on: !!payload?.on });
    return true;
  }
  if (type === "widget-push") {
    await emit("extension-widget-state", { id: extensionId, state: payload?.state ?? null });
    return true;
  }
  // Keep the Mac awake (Caffeine extension) — same contract as the hub bridge.
  if (type === "keep-awake") {
    return invoke("set_keep_awake", { on: !!payload?.on });
  }
  if (type === "keep-awake-status") {
    return invoke("keep_awake_status");
  }
  throw new Error(`unknown bridge request: ${type}`);
}
