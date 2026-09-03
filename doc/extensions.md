# 🧩 Extensions (extensions)

> Naming: UI and code identifiers now say **extension**; a few
> persisted/external contracts still keep the historical "extension" name — the
> save key `pinnedExtensions`, the manifest format's own history (see below),
> the `extension-pause` message, the `extension-*` window label, locale key
> prefixes (`extensions.*`, `extensionmgr.*`, `extensionstab.*`,
> `view.extensions`), and `extension-window.html`.

## The in-app experience

The 🧩 Extensions view has three tabs:

- **🧩 My Extensions**: an iPhone-style springboard of installed extension tiles.
- **🛍️ Marketplace**: official extensions, signed and published by this
  project's maintainer to a private signing key, listed in a `registry.json`
  fetched from a GitHub Releases **asset** URL (see "Publishing to the
  Marketplace" below — never `api.github.com`, which rate-limits
  unauthenticated calls, and never `raw.githubusercontent.com`). Each row
  shows **Install**, **Installed**, or **Update available**; installing
  shows a permission-confirmation card first (what the extension is asking
  for, straight from the registry entry) before anything downloads. A
  disk cache keeps the tab populated (marked "showing cached results")
  when the network call fails — only Install/Update disable, browsing
  never blanks out. The 🔄 button in the topbar refreshes the listing.
- **🧰 Manager**: one row per installed extension — 🔄 **reinstall from the
  Marketplace** (only shown for an unverified install with a matching
  registry entry — see "Trust levels" below), 📌 **pin** (only pinned
  extensions appear in the Quick Launch rows of the tray popover and hub
  side panel; rows hide entirely when nothing is pinned), and 🗑️
  **uninstall**. The 📦 button in the topbar installs a local zip (native
  file picker) — this always stamps the result **⚠️ unverified**, since
  there's no registry entry to check a local file's signature against.

Extensions extract to `<data-root>/extensions/<id>/` (default `~/Library/Application Support/com.junhe.mypet/extensions/`;
relocatable from Settings → Storage, which also has an **Open Folder** button
to reveal the data root in Finder); the app rescans at startup and after every
change.

- Extension pages render in their own real Tauri **child webview**, hosted
  *outside* the view grid — one per opened extension, so several can run at
  once and keep running (e.g. music keeps playing) while you browse other
  pages or close the hub. From the page's own code, this looks identical to
  the sandboxed-iframe model extensions have always targeted: the same
  `bridge()` helper, the same request/response shape (see "The bridge API"
  below) — only the transport and the permission gate underneath changed.
- **Trust levels**: every installed extension is either **verified** (came
  from the Marketplace, signature-checked against the maintainer's public
  key at install time) or **⚠️ unverified** (installed from a local zip via
  the Manager tab's 📦 button, or a pre-permission-system install carried
  over from before this system existed). Unverified extensions still run —
  sideloading your own zips for development is fully supported — they just
  say so, and if a Marketplace entry with the same id exists, the Manager
  tab offers a one-click 🔄 reinstall to upgrade in place.
- **Tray widgets**: an extension with a `widget` page in its manifest can hang
  a mini rounded box below the menu-bar popover (multiple widgets stack in
  activation order; the popover window grows to fit). Extensions can also
  open their own popup windows (`extension-window.html` shell) and send
  system notifications.
- **☕ Caffeine**: keeps the Mac from auto-sleeping (and the screen from
  dimming) while its switch is on — a `caffeinate` process held by the app
  and released when the app quits. Once installed, its toggle box hangs
  below the tray popover permanently (`widgetAuto`); the same switch lives
  on its hub page.
- **🎹 Music Player**: choose a folder with a native picker, recursive scan
  (mp3/m4a/aac/wav/flac/ogg), a transport bar, draggable seek bar, and a
  mini-player tray widget. The reference for the `get-locale` / `app-locale`
  bridge contract and for `fs:read:workspace`. Updating an extension = the
  Marketplace's "Update available" (or a Manager-tab reinstall) — no app
  rebuild or restart.
- **Localization**: bundled extensions carry an `STR` table covering the
  app's twelve languages and follow the locale contract below.

# Preparing an extension zip

Extensions are distributed as **zip files**. Installed extensions appear as
tiles on the Extensions homepage and (when pinned) as icon buttons in the
**Quick Launch** row; clicking either opens the extension's page. Beyond that
page, an extension can also hang a **mini-widget under the tray popover**,
open its own **popup windows**, and send **system notifications** — see
"Beyond the hub page" below.

## Zip layout

```
yourthing.zip
└── yourthing/               # top-level folder, name should match the id
    ├── extension.json       # REQUIRED
    ├── index.html           # entry page (see "How your page runs" below)
    └── assets/…             # anything your page references (all local)
```

A flat zip (`extension.json` at the root, no wrapping folder) also works —
the installer locates it at the root or inside a single top-level folder and
extracts everything beside it. A zip with only the historical `manifest.json`
name is a **hard install error** for a fresh install — that filename is only
ever tolerated for extensions that were already on disk before this manifest
format existed (see "Trust levels" above); every new extension, marketplace
or sideloaded, must ship `extension.json`.

## extension.json

```json
{
  "id": "yourthing",
  "name": "Your Thing",
  "names": { "zh": "你的东西", "fr": "Ton truc" },
  "emoji": "🧩",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "entry": "index.html",
  "widget": "widget.html",
  "widgetHeight": 40,
  "widgetAuto": false,
  "permissions": ["fs:read:workspace"],
  "author": "Your Name",
  "description": "One line describing what this does.",
  "icon": "https://example.com/icon.png"
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | ✅ | Unique, stable, ≤40 chars, only `a-z A-Z 0-9 - _`. Keys the install folder and the hub view (`extension:<id>`). |
| `name` | ✅ | Display name, shown under the app tile and as the page title (English / fallback). |
| `names` | optional | `{<locale>: "name"}` map for localized display names — the app language's entry wins, then `names.en`, then `name`. |
| `emoji` | optional (default 🧩) | Button/tile emoji — pick a bright one; it sits on dark and light panels. Also the Marketplace card's fallback art when `icon` is absent or fails to load. |
| `version` | ✅ | Plain `MAJOR.MINOR.PATCH`; used for "Update available" comparisons. |
| `minAppVersion` | optional | Plain `MAJOR.MINOR.PATCH` floor on the running app's own version (`CARGO_PKG_VERSION`). Install fails with a clear message if unmet. Omit for no floor. |
| `entry` | ✅ (in practice) | HTML page rendered when the extension opens; an extension without one shows "has no page". |
| `widget` | optional | HTML page for the tray mini-widget (see "Tray widgets"). |
| `widgetHeight` | optional | Widget content height in px (default 64, clamped 32–220). Keep it minimal. |
| `widgetAuto` | optional | `true` = the widget mounts as soon as the extension is installed (every app start), no `widget-set` call needed. |
| `permissions` | ✅ (may be `[]`) | Every capability this extension needs, from the fixed catalog below. An unknown string fails the whole install — nothing is written to disk. |
| `author` | optional | Display-only, shown in the Manager tab and the Marketplace permission card. |
| `description` | optional | Display-only, shown in the Manager tab and Marketplace listing. |
| `icon` | optional | Marketplace card art (an image URL); falls back to `emoji` if absent or if it fails to load. Has no effect on the installed tile, which always uses `emoji`. |

## Permission catalog

Declare exactly what you need in `permissions` — nothing more. A manifest
naming anything outside this list is rejected outright, before anything is
written to disk. `get-locale` and `say` need **no permission at all**
(read-only / non-sensitive, needed by nearly every extension just to
render).

| Permission | Unlocks |
|---|---|
| `dialog:pickFolder` | `pick-folder` |
| `fs:read:workspace` | `list-music` and `file-url` |
| `notifications:show` | `notify` |
| `windows:open` | `open-window` |
| `widgets:show` | `widget-set` and `widget-push` |
| `system:keepAwake` | `keep-awake` and `keep-awake-status` |
| `network:fetch` | Plain `fetch()`/`XMLHttpRequest` from your own page's JS — enforced by a per-webview Content-Security-Policy, not a bridge call. Without it, `connect-src` is locked to `'none'` and any network call your page makes itself will fail. |

Calling a bridge request your manifest didn't declare the permission for
fails with an error from the app (a rejected Rust command) — same as any
other bridge error, so handle it the same way you'd handle a user
cancelling a dialog.

**Trust levels and permissions, precisely**: a Marketplace or sideloaded
install's own declared `permissions` are used exactly as written — installing
never grants more or less than what's in `extension.json`. The **only**
exception is a pre-permission-system install carried over from before this
system existed (no `extension.json` on disk at all): those are granted the
*entire* catalog, matching their actual historical access, and always show
the ⚠️ unverified badge.

**Burrow Cleaner** (id `pikapet-cleaner`, source at
`extension-source/pikapet-cleaner/`, backend in `cleaner.rs`) is a normal
signed Marketplace extension like any other — it just declares the three
filesystem-adjacent permissions above (`system:stats`, `fs:scan`,
`fs:cleanup`) to get real system stats, disk scanning, and (behind a
preview-then-confirm flow in its own UI) the ability to move files to the
Trash. Nothing about it is hardcoded to its id; any extension could declare
the same permissions, and the Marketplace's signature check is what actually
gates who gets to publish one that does.

## How your page runs

Your `entry` page renders in its own Tauri **child webview**, hosted
**outside** the hub's view grid — so your page keeps running (audio keeps
playing, timers keep ticking) while the user browses other hub pages or
closes the hub window.

> ⚠️ **Pages must be self-contained single files.** The asset protocol
> encodes the page's whole file path as one URL segment, so *relative
> subresources do not resolve* — `<script src="game.js">` or
> `<link href="style.css">` silently 404 and your page loads with no JS.
> Inline all scripts and styles into the HTML (see the Music Player).
> `localStorage` may also throw here — wrap every access in `try/catch`.

Each opened extension keeps its own live webview, so **several extensions
can run at once** (music playing while another extension does its thing).
Everything must be local files inside your folder unless you've declared
`network:fetch`. Updating your extension = a Marketplace update or a Manager
reinstall — **no app rebuild or restart**.

## The bridge API

Extension pages talk to the app via `postMessage` RPC — unchanged from the
very first version of this system, even though the transport underneath is
now a real Tauri IPC call gated by your declared permissions. Send
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

Available requests:

| `type` | `payload` | `result` | Permission needed |
|---|---|---|---|
| `get-locale` | — | The app's active language code (`"en"`, `"zh"`, `"fr"`, `"es"`, `"de"`, `"ja"`, `"it"`, `"pt"`, `"ar"`, `"hi"`, `"el"`, `"ko"`) — see "Following the app's language" | none (baseline) |
| `say` | `{text, ms?}` | The desktop pet says `text` in its speech bubble (≤200 chars; `ms` display time, clamped 1–30 s, default 5 s). The app substitutes `{callMe}` → what the pet calls its owner and `{petName}` → the pet's name. Skipped while the pet is away on a tour. | none (baseline) |
| `pick-folder` | — | Absolute folder path chosen in a native picker, or `null` if cancelled | `dialog:pickFolder` |
| `list-music` | `{dir}` | Array of absolute audio-file paths (recursive, mp3/m4a/aac/wav/flac/ogg) | `fs:read:workspace` |
| `file-url` | `{path}` | An asset-protocol URL usable as `src` for `<audio>`/`<img>` etc. | `fs:read:workspace` |
| `notify` | `{title, body}` | Sends a system push notification | `notifications:show` |
| `open-window` | `{page, width, height, title}` | Opens `page` (a file in your folder) in its own native window; one per extension — calling again focuses it | `windows:open` |
| `widget-set` | `{on}` | Shows/hides your tray mini-widget (needs `widget` in the manifest) | `widgets:show` |
| `widget-push` | `{state}` | Sends any JSON state to your live widget page | `widgets:show` |
| `keep-awake` | `{on}` | Prevents the Mac from auto-sleeping (and the display from dimming) while on. Returns the resulting state (`true`/`false`) | `system:keepAwake` |
| `keep-awake-status` | — | Whether keep-awake is currently on — poll it if you show a toggle, another surface may have flipped it | `system:keepAwake` |

Plain `fetch()`/`XMLHttpRequest` calls from your own page's JS need
`network:fetch` declared (see the permission catalog above) — there's no
bridge `type` for it, it's a CSP gate on your page's own network access.

## Following the app's language

The app is multilingual (twelve languages — Settings → 🌐 Language), and
extensions are expected to localize **themselves**: the app only tells you
which language is active. The contract has two parts:

1. **At boot**, ask once: `bridge("get-locale")` resolves to a two-letter
   locale code.
2. **On change**, the app posts a plain message into your page (same
   channel as `extension-pause`): `{type: "app-locale", locale}` — re-render
   your text when it arrives.

The recommended pattern (this is exactly what the Music Player does — copy
it):

```js
const STR = {
  en: { pick: "📂 Choose Folder", /* … every string your page shows … */ },
  zh: { pick: "📂 选择文件夹", /* … */ },
  // fr / es / de / ja / it / pt / ar / hi / el / ko …
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
extension), the app posts a plain message into your page:

```js
window.addEventListener("message", (e) => {
  if (e.data?.type === "extension-pause") pauseMyGame();
});
```

Games should listen and pause. Extensions that are meant to keep running in
the background (music players) simply ignore it. Note that a hidden/backgrounded
webview also stops receiving `requestAnimationFrame` callbacks, so
rAF-driven loops freeze either way — the message is what lets you show your
pause overlay instead of resuming mid-action.

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

The widget page runs in a separate sandboxed frame, so it doesn't share JS
state with your main page. Widgets get a **small, fixed, always-available
subset of the bridge** regardless of what permissions you declared —
`get-locale`, `keep-awake`, `keep-awake-status`, `notify`, and
`sys-status-snapshot` (plain CPU/memory/network numbers, no paths — see the
Burrow Cleaner extension) — so a widget still works even while your
main page isn't loaded (this subset predates the permission system and
stayed unconditional on purpose: it's the same handful of calls every widget
has always needed). For everything else it talks to your main page through
three tiny messages:

- Widget → app: `parent.postMessage({type: "widget-ready"}, "*")` once on
  load — the app replies with the latest state so you're never blank.
- Main page → widget: `bridge("widget-push", {state: {...}})`; the widget
  receives it as a `message` event with `{type: "widget-state", state}`.
- Widget → main page: `parent.postMessage({type: "widget-action", payload:
  {...}}, "*")`; your main page receives `{type: "widget-action", payload}`
  as a `message` event.

### Popup windows

`bridge("open-window", {page: "popup.html", width: 480, height: 360, title:
"My Thing"})` opens a real native window rendering that file from your folder,
with the same bridge available inside it (minus `say`, which is main-page-only).
One popup per extension; closing it destroys it. (Widget-action messages are
only delivered to your hub page.)

### Push notifications

`bridge("notify", {title: "Music", body: "Playlist finished 🎶"})` posts to
the system notification center. Use sparingly — it's the user's screen.

The reference implementation is the **🎹 Music Player** — folder picker,
scan, play/pause, draggable seek bar, shuffle / loop / repeat-one, a
mini-player tray widget, and full localization via `get-locale` +
`app-locale`. Start by copying it.

## Install / uninstall mechanics (what the app does)

- **Marketplace install**: the app downloads the entry's `url`, verifies the
  bytes' sha256 and ed25519 signature against the registry entry's
  `sha256`/`signature` and the app's embedded public key, **then** parses
  `extension.json`, validates the schema/`minAppVersion`/permissions, and
  extracts — replacing any previous version, so an upgrade is just
  installing again. A `.verified` marker is written on success; that's what
  makes the install show up **without** the ⚠️ unverified badge.
- **Sideload (Manager tab → 📦)**: identical validation/extraction, but with
  no signature to check — always ⚠️ unverified, no `.verified` marker.
- **Scan**: the app lists the extensions directory at startup and after
  every install/uninstall; each extension's own `extension.json` (or, for a
  legacy install, `manifest.json`) is the source of truth for its emoji,
  name, and pages.
- **Uninstall**: closes any open webview/window for it, then deletes the
  folder. Nothing else to clean.
- Paths containing `..` are skipped during extraction, regardless of source.

## Publishing to the Marketplace

**All Marketplace extensions are hosted on the maintainer's own GitHub
Releases, signed with a private key only the maintainer holds.** There is no
self-serve publishing: an extension zip that isn't in `registry.json`, signed
against the embedded public key, simply never appears in the Marketplace tab
— no matter who wrote it or where it's hosted. This is deliberate, not a
missing feature: every Marketplace install is something the app already
trusted *before* the extension's own permission prompt ever mattered, so
letting anyone add themselves to the registry would defeat the whole point
of it being signed.

### If you are the maintainer: the release pipeline

One-time setup:

```bash
cargo run --bin sign-extension -- keygen
```

This writes a private key file (default `extension-signing-key.b64` — already
gitignored; keep it **offline**, never commit it) and prints a public-key
array literal. Paste that into `src/signing.rs`'s `PUBLIC_KEY` constant and
rebuild the app once — every future install by every user is checked against
whatever key is embedded there.

Per extension, per release:

1. Build the zip (`extension.json` + entry page + assets, see "Preparing an
   extension zip" above) — the same shape whether it's your own extension or
   one you're approving from someone else.
2. Sign it:
   ```bash
   cargo run --bin sign-extension -- sign path/to/yourthing.zip
   ```
   Prints `sha256:` and `signature:` — the exact values `registry.json` needs.
3. Upload the zip as an asset on a GitHub Release in your extensions repo
   (this project publishes to `hejun0524/PikaPet-Extensions`, tag `latest` —
   see `MARKETPLACE_REPO`/`MARKETPLACE_TAG` in `src/extensions/registry.rs`
   if you're running your own fork against a different repo).
4. Add (or update) its entry in `registry.json`:
   ```json
   {
     "id": "yourthing",
     "version": "1.0.0",
     "url": "https://github.com/<owner>/<repo>/releases/download/latest/yourthing.zip",
     "sha256": "<from step 2>",
     "signature": "<from step 2>",
     "name": "Your Thing",
     "description": "One line describing what this does.",
     "emoji": "🧩",
     "permissions": ["fs:read:workspace"]
   }
   ```
   `description`, `icon`, and `emoji` are optional display fields; `permissions`
   is optional too, but omitting it means the Marketplace's pre-install
   permission card shows nothing — the real enforcement is still
   `extension.json`'s own declared permissions, checked again at install
   time regardless of what the registry says, but showing the true list
   here is what makes the permission prompt honest.
5. Upload the updated `registry.json` as an asset on the same `latest`
   release, overwriting the previous one. Every running copy of the app
   picks it up next time the Marketplace tab is opened or refreshed — no
   app update needed.

A local `dist/` folder (gitignored) is a convenient staging area for zips +
`registry.json` before uploading — there's nothing special about the name,
it's just not meant to be committed.

### If you are a third-party extension author

You cannot publish directly to the Marketplace — that requires the
maintainer's private key, which never leaves their machine. Two paths:

- **Share it as a zip.** Anyone can install your extension right now via the
  Manager tab's 📦 "Install extension from zip…" button. It'll show the
  ⚠️ unverified badge forever (there's no registry entry to verify it
  against), but it runs exactly the same as a verified install, with exactly
  the permissions you declared in `extension.json` — this is the right path
  for personal tools, one-off jokes, or anything you don't need discoverable
  in-app.
- **Submit it for review.** Send the maintainer your zip (built per this
  doc, with `extension.json` declaring only the permissions you actually
  need — a smaller ask is an easier approval). If they approve it, they sign
  it with their own key and add it to `registry.json` themselves, following
  the pipeline above — at that point it shows up in every user's Marketplace
  tab as a verified install, and future updates go through the same review
  each time you want to publish a new version.

## Checklist before zipping

- [ ] `extension.json` with unique `id`, `name`, `version`, and a
      `permissions` array covering everything you call (declare nothing you
      don't need — reviewers and installing users both see this list)
- [ ] `entry` page is self-contained (JS/CSS inlined — relative subresources don't load)
- [ ] No network calls unless `network:fetch` is declared
- [ ] Strings live in an `STR` table; `get-locale` fetched at boot and
      `app-locale` handled (English fallback for locales you don't ship)
- [ ] `zip -r yourthing.zip yourthing` from the parent directory
- [ ] Test: Manager tab → 📦 Install from zip → tile appears (marked
      ⚠️ unverified, as expected for a sideload) → page opens with exactly
      the permissions you declared working and nothing else → uninstall
      removes it cleanly
- [ ] If submitting for Marketplace review: send the zip to the maintainer:
      see "If you are a third-party extension author" above
