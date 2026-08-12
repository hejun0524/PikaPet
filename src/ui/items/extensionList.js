// items/extensionList.js

import { getLocale } from "../shared/i18n.js";

/**
 * Normalize the installed-extensions list that comes from the Rust manifest
 * scan (`list_installed_extensions`) into the display shape used by the UI,
 * filling in fallbacks for missing emoji/name.
 *
 * Names follow the app language: a manifest may carry an optional
 * `names: {<locale>: "…"}` map (see doc/addons.md) — the active locale's
 * entry wins, then the map's "en", then the plain `name` field, then the id.
 *
 * Extensions are installed from zip files (Extensions manager → Install
 * extension) into the app-data addons directory.
 *
 * @param {Array<object>|null|undefined} installed - Raw manifest entries
 *   (`{ id, emoji?, name?, names?, entry?, dir? }`); `null`/`undefined` is
 *   treated as an empty list.
 * @returns {Array<{id: string, emoji: string, name: string, entry: string|undefined, dir: string|undefined}>}
 *   Display-ready extension entries (name already localized).
 */
export function extensionList(installed) {
  return (installed ?? []).map((a) => ({
    id: a.id,
    emoji: a.emoji || "🧩",
    name: (a.names && (a.names[getLocale()] ?? a.names.en)) || a.name || a.id,
    entry: a.entry,
    dir: a.dir,
  }));
}
