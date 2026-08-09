# 🧩 Preparing an Add-on Zip for MyPetGame

Add-ons are distributed as **zip files** and managed entirely from inside the
app: the **🧩 Add-ons homepage** in the hub shows installed add-ons as an
iPhone-style grid of app tiles, and its **🧰 manager** (top-right button) has
**"📦 Install add-on from zip…"** (a file picker opens) plus a 🗑️ uninstall
icon per add-on. No manual folder digging required.

Installed add-ons appear as tiles on the Add-ons homepage and as icon buttons
in the **Quick Launch** row (below the navigation buttons in the menu-bar
popover and the hub's left panel); clicking either opens the add-on's page. Beyond that page, an add-on can also hang a
**mini-widget under the tray popover**, open its own **popup windows**, and
send **system notifications** — see "Beyond the hub page" below.

## Zip layout

```
yourthing.zip
└── yourthing/               # top-level folder, name should match the id
    ├── manifest.json        # REQUIRED
    ├── index.html           # entry page (optional, see "Page types" below)
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
  "emoji": "🧩",
  "version": "1.0.0",
  "entry": "index.html",
  "widget": "widget.html",
  "widgetHeight": 40
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | ✅ | Unique, stable, ≤40 chars, only `a-z A-Z 0-9 - _`. Keys the install folder and the hub view (`addon:<id>`). |
| `name` | ✅ | Display name, shown under the app tile and as the page title. |
| `emoji` | ✅ | Button/tile emoji — pick a bright one; it sits on dark and light panels. |
| `version` | ✅ | Semver string; used for upgrade hints. |
| `entry` | ✅ (in practice) | HTML page rendered when the add-on opens; an add-on without one shows "has no page". |
| `widget` | optional | HTML page for the tray mini-widget (see "Tray widgets"). |
| `widgetHeight` | optional | Widget content height in px (default 64, clamped 32–220). Keep it minimal. |

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
> `localStorage` may also throw here — wrap every access in `try/catch`. Each opened add-on keeps its own live iframe, so **several add-ons
can run at once** (music playing while another add-on does its thing).
Everything must be local files inside your folder: no network access.
Updating your add-on = the user reinstalls the new zip — **no app rebuild or
restart**.

## The bridge API

Add-on pages talk to the app via `postMessage` RPC. Send
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

Available requests (the allowlist lives in `frontend/hub.js`; PRs welcome):

| `type` | `payload` | `result` |
|---|---|---|
| `pick-folder` | — | Absolute folder path chosen in a native picker, or `null` if cancelled |
| `list-music` | `{dir}` | Array of absolute audio-file paths (recursive, 2 levels, mp3/m4a/aac/wav/flac/ogg) |
| `file-url` | `{path}` | An asset-protocol URL usable as `src` for `<audio>`/`<img>` etc. |
| `say` | `{text, ms?}` | The desktop pet says `text` in its speech bubble (≤200 chars; `ms` display time, clamped 1–30 s, default 5 s). The app substitutes `{callMe}` → what the pet calls its owner (registry page setting, e.g. "Papa") and `{petName}` → the pet's name, so add-ons never see that data. Great for game results — friendlier than a notification. Skipped while the pet is away on a tour. |
| `notify` | `{title, body}` | Sends a system push notification (macOS notification center) |
| `open-window` | `{page, width, height, title}` | Opens `page` (a file in your folder) in its own native window; one per add-on — calling again focuses it |
| `widget-set` | `{on}` | Shows/hides your tray mini-widget (needs `widget` in the manifest) |
| `widget-push` | `{state}` | Sends any JSON state to your live widget page |

## Pausing when the user walks away

When the user leaves your page (the ← back button, a nav button, another
add-on), the app posts a plain message into your iframe:

```js
window.addEventListener("message", (e) => {
  if (e.data?.type === "addon-pause") pauseMyGame();
});
```

Games should listen and pause. Add-ons that are meant to keep running in the
background (music players) simply ignore it. Note that a hidden iframe also
stops receiving `requestAnimationFrame` callbacks, so rAF-driven loops freeze
either way — the message is what lets you show your pause overlay instead of
resuming mid-action.

## Beyond the hub page

### Tray widgets (mini boxes under the popover)

Declare `"widget": "widget.html"` in your manifest. When your main page calls
`bridge("widget-set", {on: true})`, that page appears as a **small rounded box
hanging below the menu-bar popover** — a mini music player, a status readout.
If several add-ons show widgets, they stack in the order they were turned on.
Keep the design *minimal*: one row of content is ideal (`widgetHeight` ≈ 40).

The widget page is a separate iframe in a separate window, so it doesn't share
JS state with your main page. It talks through three tiny messages:

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
with the same bridge available inside it. One popup per add-on; closing it
destroys it. (Widget-action messages are only delivered to your hub page.)

### Push notifications

`bridge("notify", {title: "Music", body: "Playlist finished 🎶"})` posts to
the system notification center. Use sparingly — it's the user's screen.

The reference implementation is the **🎹 Music Player** — this repo's
`addons/music.zip` is a complete, self-contained example (folder picker,
scan, play/pause, draggable seek bar, shuffle / loop / repeat-one, and a
mini-player tray widget in `widget.html`). Start by copying it.

## Install / uninstall mechanics (what the app does)

- **Install**: your zip is validated (manifest present, sane `id`) and
  extracted to `~/Library/Application Support/com.junhe.mypet/addons/<id>/`,
  replacing any previous version — so an upgrade is just installing the new
  zip. Paths containing `..` are skipped.
- **Scan**: the app lists that directory at startup and after every
  install/uninstall; your manifest is the single source of truth for the
  add-on's emoji, name, and pages.
- **Uninstall**: deletes the folder. Nothing else to clean.
- The repo's `addons/` folder is *not* bundled into the shipped app — it's
  a convenient place to keep zips during development (like `pets/` for
  source artwork).

## Checklist before zipping

- [ ] `manifest.json` with unique `id`, `name`, bright `emoji`, `version`
- [ ] `entry` page is self-contained (JS/CSS inlined — relative subresources don't load)
- [ ] No external network dependencies (the iframe has no internet)
- [ ] `zip -r yourthing.zip yourthing` from the parent directory
- [ ] Test: Add-ons homepage → 🧰 manager → Install from zip → tile appears → page opens
      → Uninstall removes it cleanly
