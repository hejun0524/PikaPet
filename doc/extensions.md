# 🧩 Extensions (extensions)

> Naming: UI and code identifiers now say **extension**; a few
> persisted/external contracts still keep the historical "extension" name — the
> save key `pinnedExtensions`, the manifest format, the `extension-pause` message,
> the `extension-*` window label, locale key prefixes (`extensions.*`, `extensionmgr.*`,
> `extensionstab.*`, `view.extensions`), and `extension-window.html`. The on-disk install
> directory itself was renamed from `extensions/` to `extensions/` (2026-08-16,
> no migration needed — pre-rename installs weren't preserved).

## The in-app experience

The 🧩 Extensions view has three tabs:

- **🧩 My Extensions**: an iPhone-style springboard of installed extension tiles.
- **🛍️ Marketplace**: official extension zips published as assets on a GitHub Release. The list comes straight from the GitHub API (latest release of `MARKETPLACE_REPO` in `src/ui/hub/marketplace.js`); ⬇️ Install downloads the zip over https (Rust `install_extension_from_url`) and installs it like a local zip. **Publishing**: create a release on that repo and attach the zips from `extensions/` — the asset filename must be `<id>.zip` matching the manifest `id` (that's how installed state is detected). Until the repo exists the tab shows a friendly "unreachable" note.
- **🧰 Manager**: install ("📦 Install extension from zip…", native file picker), uninstall (🗑️), and 📌 **pin** — only pinned extensions appear in the Quick Launch rows of the tray popover and hub side panel (rows hide entirely when nothing is pinned). The open extension's Quick Launch button highlights like the World buttons.

Zips extract to `<data-root>/extensions/<id>/` (default `~/Library/Application Support/com.junhe.mypet/extensions/`; relocatable from Settings → Storage, which also has an **Open Folder** button to reveal the data root in Finder); the app rescans at startup and after every change.
- Extension pages render in sandboxed iframes hosted *outside* the view grid — one live iframe per opened extension, so several can run at once and keep running (e.g. music keeps playing) while you browse other pages or close the hub. They talk to the app through a **postMessage bridge** (see "The bridge API" below).
- **Tray widgets**: an extension with a `widget` page in its manifest can hang a mini rounded box below the menu-bar popover (multiple widgets stack in activation order; the popover window grows to fit). Extensions can also open their own popup windows (`extension-window.html` shell) and send macOS push notifications (osascript).
- **☕ Caffeine** (`extensions/caffeine.zip`): keeps the Mac from auto-sleeping (and the screen from dimming) while its switch is on — a `caffeinate` process held by the app and released when the app quits. Once installed, its toggle box hangs below the tray popover permanently (`widgetAuto`); the same switch lives on its hub page. The reference for `widgetAuto` + the widget bridge subset.
- **🎹 Music Player** (`extensions/music.zip`): choose a folder with a native picker, recursive scan (mp3/m4a/aac/wav/flac/ogg), a uniform monochrome-icon transport bar — prev / play-pause / next / shuffle / loop-playlist / repeat-one — draggable seek bar, Play All, and a mini-player tray widget (title + prev/play/next) that appears once playback starts. Fully localized (the reference for the `get-locale` / `app-locale` bridge contract). Updating an extension = reinstalling the zip — no app rebuild or restart.
- **Localization**: every bundled extension (all ten zips) carries an `STR` table covering the app's twelve languages (en, zh, fr, es, de, ja, it, pt, ar, hi, el, ko) and follows the locale contract below.

# Preparing an extension zip

Extensions are distributed as **zip files** and managed entirely from inside the
app — no manual folder digging required. Installed extensions appear as tiles on
the Extensions homepage and (when pinned) as icon buttons in the **Quick Launch**
row; clicking either opens the extension's page. Beyond that page, an extension can
also hang a **mini-widget under the tray popover**, open its own **popup
windows**, and send **system notifications** — see "Beyond the hub page"
below.

## Zip layout

```
yourthing.zip
└── yourthing/               # top-level folder, name should match the id
    ├── manifest.json        # REQUIRED
    ├── index.html           # entry page (see "How your page runs" below)
    └── assets/…             # anything your page references (all local)
```

A flat zip (manifest.json at the root, no wrapping folder) also works — the
installer locates `manifest.json` at the root or inside a single top-level
folder and extracts everything beside it.

## manifest.json

```json
{
  "id": "yourthing",
  "name": "Your Thing",
  "names": { "zh": "你的东西", "fr": "Ton truc" },
  "emoji": "🧩",
  "version": "1.0.0",
  "entry": "index.html",
  "widget": "widget.html",
  "widgetHeight": 40,
  "widgetAuto": false
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | ✅ | Unique, stable, ≤40 chars, only `a-z A-Z 0-9 - _`. Keys the install folder and the hub view (`extension:<id>`). |
| `name` | ✅ | Display name, shown under the app tile and as the page title (English / fallback). |
| `names` | optional | `{<locale>: "name"}` map for localized display names — the app language's entry wins, then `names.en`, then `name`. All ten bundled extensions ship all twelve app locales. |
| `emoji` | ✅ | Button/tile emoji — pick a bright one; it sits on dark and light panels. |
| `version` | ✅ | Semver string; used for upgrade hints. |
| `entry` | ✅ (in practice) | HTML page rendered when the extension opens; an extension without one shows "has no page". |
| `widget` | optional | HTML page for the tray mini-widget (see "Tray widgets"). |
| `widgetHeight` | optional | Widget content height in px (default 64, clamped 32–220). Keep it minimal. |
| `widgetAuto` | optional | `true` = the widget mounts as soon as the extension is installed (every app start), no `widget-set` call needed. For always-there utility widgets like Caffeine's toggle; leave it off for on-demand widgets like the mini music player. |

## How your page runs

Your `entry` page renders in an `<iframe sandbox="allow-scripts
allow-same-origin">` served through the asset protocol, hosted **outside**
the hub's view grid — so your page keeps running (audio keeps playing, timers
keep ticking) while the user browses other hub pages or closes the hub
window.

> ⚠️ **Pages must be self-contained single files.** The asset protocol
> encodes the page's whole file path as one URL segment, so *relative
> subresources do not resolve* — `<script src="game.js">` or
> `<link href="style.css">` silently 404 and your page loads with no JS.
> Inline all scripts and styles into the HTML (see the Music Player).
> `localStorage` may also throw here — wrap every access in `try/catch`. Each opened extension keeps its own live iframe, so **several extensions
can run at once** (music playing while another extension does its thing).
Everything must be local files inside your folder: no network access.
Updating your extension = the user reinstalls the new zip — **no app rebuild or
restart**.

## The bridge API

Extension pages talk to the app via `postMessage` RPC. Send
`{reqId, type, payload}` to `parent`; the app answers with
`{reqId, result, error}`. Copy this helper into your page:

```js
let nextReq = 1;
const pending = new Map();
function bridge(type, payload) {
  return new Promise((resolve, reject) => {
    const reqId = nextReq++;
    pending.set(reqId, { resolve, reject });
    parent.postMessage({ reqId, type, payload }, "*");
  });
}
window.addEventListener("message", (e) => {
  const { reqId, result, error } = e.data ?? {};
  const p = pending.get(reqId);
  if (!p) return;
  pending.delete(reqId);
  error ? p.reject(new Error(error)) : p.resolve(result);
});
```

Available requests (the allowlist lives in `src/ui/hub/handleExtensionRequest.js`;
PRs welcome):

| `type` | `payload` | `result` |
|---|---|---|
| `get-locale` | — | The app's active language code (`"en"`, `"zh"`, `"fr"`, `"es"`, `"de"`, `"ja"`) — see "Following the app's language" |
| `pick-folder` | — | Absolute folder path chosen in a native picker, or `null` if cancelled |
| `list-music` | `{dir}` | Array of absolute audio-file paths (recursive, 2 levels, mp3/m4a/aac/wav/flac/ogg) |
| `file-url` | `{path}` | An asset-protocol URL usable as `src` for `<audio>`/`<img>` etc. |
| `say` | `{text, ms?}` | The desktop pet says `text` in its speech bubble (≤200 chars; `ms` display time, clamped 1–30 s, default 5 s). The app substitutes `{callMe}` → what the pet calls its owner (registry page setting, e.g. "Papa") and `{petName}` → the pet's name, so extensions never see that data. Great for game results — friendlier than a notification. Skipped while the pet is away on a tour. |
| `notify` | `{title, body}` | Sends a system push notification (macOS notification center) |
| `open-window` | `{page, width, height, title}` | Opens `page` (a file in your folder) in its own native window; one per extension — calling again focuses it |
| `widget-set` | `{on}` | Shows/hides your tray mini-widget (needs `widget` in the manifest) |
| `widget-push` | `{state}` | Sends any JSON state to your live widget page |
| `keep-awake` | `{on}` | Prevents the Mac from auto-sleeping (and the display from dimming) while on — a `caffeinate` process held by the app, released on quit. Returns the resulting state (`true`/`false`) |
| `keep-awake-status` | — | Whether keep-awake is currently on — poll it if you show a toggle, another surface may have flipped it |

## Following the app's language

The app is multilingual (English, 中文, Français, Español, Deutsch, 日本語 —
Settings → 🌐 Language), and extensions are expected to localize **themselves**:
the app only tells you which language is active. The contract has two parts:

1. **At boot**, ask once: `bridge("get-locale")` resolves to a two-letter
   code (`"en"`, `"zh"`, `"fr"`, `"es"`, `"de"`, `"ja"` today; more may come).
2. **On change**, the app posts a plain message into your iframe (same
   channel as `extension-pause`): `{type: "app-locale", locale}` — re-render your
   text when it arrives.

The recommended pattern (this is exactly what the Music Player does — copy
it):

```js
const STR = {
  en: { pick: "📂 Choose Folder", /* … every string your page shows … */ },
  zh: { pick: "📂 选择文件夹", /* … */ },
  // fr / es / de / ja …
};
let locale = "en";
const s = (key) => (STR[locale] ?? STR.en)[key];   // unknown locale -> English

bridge("get-locale").then((l) => { if (STR[l]) locale = l; render(); }).catch(() => {});
window.addEventListener("message", (e) => {
  if (e.data?.type === "app-locale") {
    locale = STR[e.data.locale] ? e.data.locale : "en";
    render();
  }
});
```

Rules of thumb:

- **Always fall back to English** for locales you don't ship — never render
  raw keys or blanks.
- **Ship at least English.** Any subset of the other languages is fine; the
  fallback covers the rest.
- **Widgets** can call `get-locale` themselves (it's in the widget bridge
  subset), but they don't receive the `app-locale` push — either poll, or
  pass the locale along in your `widget-push` state (`{title, playing,
  locale}`) and keep a little `STR` table in the widget page — see the Music
  Player's `widget.html`.
- Popup windows opened via `open-window` have the bridge, so they can call
  `get-locale` themselves; the `app-locale` push only reaches your hub-hosted
  page (relay it if the popup needs live switching).
- Keep your strings in one `STR` table at the top of the file — a translator
  (or a future you) should never have to hunt through the page logic.

## Pausing when the user walks away

When the user leaves your page (the ← back button, a nav button, another
extension), the app posts a plain message into your iframe:

```js
window.addEventListener("message", (e) => {
  if (e.data?.type === "extension-pause") pauseMyGame();
});
```

Games should listen and pause. Extensions that are meant to keep running in the
background (music players) simply ignore it. Note that a hidden iframe also
stops receiving `requestAnimationFrame` callbacks, so rAF-driven loops freeze
either way — the message is what lets you show your pause overlay instead of
resuming mid-action.

## Beyond the hub page

### Tray widgets (mini boxes under the popover)

Declare `"widget": "widget.html"` in your manifest. When your main page calls
`bridge("widget-set", {on: true})`, that page appears as a **small rounded box
hanging below the menu-bar popover** — a mini music player, a status readout.
If several extensions show widgets, they stack in the order they were turned on.
Keep the design *minimal*: one row of content is ideal (`widgetHeight` ≈ 40).

Add `"widgetAuto": true` and the widget instead mounts **on its own at every
app start** — no `widget-set` call, no need for your main page to ever be
opened. That's the right mode for always-there utility widgets (Caffeine's
keep-awake toggle); on-demand widgets like the mini music player should keep
appearing only when relevant.

The widget page is a separate iframe in a separate window, so it doesn't share
JS state with your main page. Widgets get a **small self-serve subset of the
bridge** (same `{reqId, type, payload}` helper as above, so a widget can work
even while your main page isn't loaded): `get-locale`, `keep-awake`,
`keep-awake-status`, and `notify`. For everything else it talks to your main
page through three tiny messages:

- Widget → app: `parent.postMessage({type: "widget-ready"}, "*")` once on
  load — the app replies with the latest state so you're never blank.
- Main page → widget: `bridge("widget-push", {state: {...}})`; the widget
  receives it as a `message` event with `{type: "widget-state", state}`.
- Widget → main page: `parent.postMessage({type: "widget-action", payload:
  {...}}, "*")`; your main page (the hub iframe) receives
  `{type: "widget-action", payload}` as a `message` event.

### Popup windows

`bridge("open-window", {page: "popup.html", width: 480, height: 360, title:
"My Thing"})` opens a real native window rendering that file from your folder,
with the same bridge available inside it. One popup per extension; closing it
destroys it. (Widget-action messages are only delivered to your hub page.)

### Push notifications

`bridge("notify", {title: "Music", body: "Playlist finished 🎶"})` posts to
the system notification center. Use sparingly — it's the user's screen.

The reference implementation is the **🎹 Music Player** — this repo's
`extensions/music.zip` is a complete, self-contained example (folder picker,
scan, play/pause, draggable seek bar, shuffle / loop / repeat-one, a
mini-player tray widget in `widget.html`, and full localization in all six
app languages via `get-locale` + `app-locale`). Start by copying it.

## Install / uninstall mechanics (what the app does)

- **Install**: your zip is validated (manifest present, sane `id`) and
  extracted to `~/Library/Application Support/com.junhe.mypet/extensions/<id>/`,
  replacing any previous version — so an upgrade is just installing the new
  zip. Paths containing `..` are skipped.
- **Scan**: the app lists that directory at startup and after every
  install/uninstall; your manifest is the single source of truth for the
  extension's emoji, name, and pages.
- **Uninstall**: deletes the folder. Nothing else to clean.
- The repo's `extensions/` folder is *not* bundled into the shipped app — it's
  a convenient place to keep zips during development.

## Checklist before zipping

- [ ] `manifest.json` with unique `id`, `name`, bright `emoji`, `version`
- [ ] `entry` page is self-contained (JS/CSS inlined — relative subresources don't load)
- [ ] No external network dependencies (the iframe has no internet)
- [ ] Strings live in an `STR` table; `get-locale` fetched at boot and
      `app-locale` handled (English fallback for locales you don't ship)
- [ ] `zip -r yourthing.zip yourthing` from the parent directory
- [ ] Test: Extensions homepage → 🧰 manager → Install from zip → tile appears → page opens
      → Uninstall removes it cleanly
