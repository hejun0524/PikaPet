// items/addonList.js

/**
 * Normalize the installed-add-ons list that comes from the Rust manifest
 * scan (`list_installed_addons`) into the display shape used by the UI,
 * filling in fallbacks for missing emoji/name.
 *
 * Add-ons are installed from zip files (Add-ons manager → Install add-on)
 * into the app-data addons directory.
 *
 * @param {Array<object>|null|undefined} installed - Raw manifest entries
 *   (`{ id, emoji?, name?, entry?, dir? }`); `null`/`undefined` is treated
 *   as an empty list.
 * @returns {Array<{id: string, emoji: string, name: string, entry: string|undefined, dir: string|undefined}>}
 *   Display-ready add-on entries.
 */
export function addonList(installed) {
  return (installed ?? []).map((a) => ({
    id: a.id,
    emoji: a.emoji || "🧩",
    name: a.name || a.id,
    entry: a.entry,
    dir: a.dir,
  }));
}
