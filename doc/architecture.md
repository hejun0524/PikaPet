# 🏗️ Architecture

## Project structure

```
PikaPet/                      # The Tauri v2 Rust crate lives at the repo root: `cargo run` here
├── Cargo.toml / build.rs     # Crate manifest + tauri-build hook (also registers the app-command ACL manifest)
├── tauri.conf.json           # App config: the four windows, asset protocol scope, frontendDist = src/ui, updater plugin config
├── capabilities/              # Security allowlist: which Tauri commands each window/webview may call
│   ├── default.json          #   general app commands, for windows main/setup + webviews hub/stats
│   └── hub.json               #   commands only the hub needs (extension hosting/pushing)
├── icons/                    # Paw app icons + monochrome paw tray template
├── src/
│   ├── main.rs               # Windows, tray, menus, save-file/reset commands, music scan; wires every plugin/module below together
│   ├── lib.rs                 # Minimal library target: lets src/bin/sign-extension.rs share signing.rs with the app
│   ├── signing.rs             # ed25519 sign/verify shared by the app's installer and the sign-extension CLI (see doc/extensions.md)
│   ├── updates.rs              # Background app auto-update: check/download/install, "Restart to Update" state (see doc/roadmap.md)
│   ├── extensions/             # The extension system: manifest schema + permission catalog (manifest.rs),
│   │   │                       #   install/uninstall/list (install.rs), per-extension Tauri capability
│   │   │                       #   generation (capability.rs), the app↔extension bridge (bridge.rs), child-webview
│   │   │                       #   hosting (hosting.rs), Marketplace registry fetch/cache (registry.rs), and
│   │   │                       #   pre-permission-system install detection (migration.rs) — see doc/extensions.md
│   │   └── …
│   ├── bin/
│   │   └── sign-extension.rs  # Maintainer-only CLI: keygen + sign, for publishing to the Marketplace (doc/extensions.md)
│   └── ui/                   # All UI — plain HTML/CSS/JS, no bundler (EMBEDDED in the binary)
│       ├── index.html/main.js/style.css    # Desktop pet window: sprite animation, drag, speech bubbles, travel runs, context menu
│       ├── stats.html/stats.js/stats.css   # Menu bar popover + THE STATE OWNER: game clocks, save/load, all mutations
│       ├── hub.html/hub.js/hub.css         # Hub window: Home / Life / Career / Touring / Achievements / Pet Center / Pika's Trading Post / Fight Club / Delivery / Dune / Extensions / Settings + extension host
│       ├── extension-window.html/.js # Shell for extension popup windows (iframe + bridge)
│       ├── setup.html/setup.js/setup.css   # First-run welcome window (choose pet, name, call-me)
│       ├── items.js              # Shared catalog: items, prices, stores, caretakers, bank rates, species, extension helpers
│       ├── school.js             # Shared school data: stages, subjects, courses, progression helpers
│       ├── career.js             # Shared career data: careers, generated job ranks, tier/level helpers
│       ├── touring.js            # Shared touring data: destinations, leagues, tours, tickets, Pika constants
│       ├── kitchen.js            # Shared kitchen data: ingredients, recipes (8 basic + generated city dishes), paw-bots, skill books
│       ├── fightclub.js           # Shared Fight Club data: skills, Skill Books, challenger roster
│       ├── tasks.js               # Shared Dune's Daily Tasks data: task pool, difficulty tiers
│       ├── panel.js / panel.css  # Shared pet-panel rendering (meters/traits/pocket/status/extension buttons)
│       ├── shared/               # Cross-window plumbing: tauri.js (API access), i18n.js (t()/tOr()), names.js (translated catalog names), jlog.js
│       ├── locales/              # One dictionary per language: en / zh / fr / es / de / ja / it / pt / ar / hi / el / ko
│       └── pets/                 # The spritesheets (8×11 grids of 192×208 frames; single source of truth)
├── dist/                       # gitignored: staging area for signed extension zips + registry.json before
│   │                            #   uploading to Releases, and (via `cargo tauri build`) app updater artifacts
├── scripts/
│   └── i18n-check.mjs        # Repo-level dev tooling (not app source): headless localization check
└── doc/                      # This documentation (linked from the README's table)
```

The JS is organized as browser ES modules with **one function per file**: each window has an entry file (`hub.js`, `stats.js`, `main.js`, `setup.js`, `extension-window.js`) plus a folder of per-function modules (`hub/`, `stats/`, …); the old shared filenames (`items.js`, `school.js`, …) remain as master files that only re-export. Mutable state lives in each window's `state.js`.

There is deliberately no `extensions/` folder of development zips in the repo
anymore (there was, before the Marketplace rework — see `doc/extensions.md`)
— every extension now lives only as a signed asset on the maintainer's
GitHub Releases, or as a local zip a developer builds and sideloads
themselves. `dist/` is where those get staged locally before uploading; it's
gitignored, same as the signing private key.

## Architecture notes

- **Four windows**: `main` (transparent, always-on-top pet), `stats` (popover under the tray icon), `hub` (a normal resizable window, min 700×480, responsive card grid, VSCode-style draggable side-panel splitter), and `setup` (first run only). The hub has eleven views — 🏠 Home / 🧺 Life / 💼 Career / 🗺️ Touring / 🏆 Achievements / 💖 Pet Center / 🐱 Pika's Trading Post / 🥊 Darcy's Fight Club / 🚚 Noonie's Delivery Service / 🧩 Extensions / ⚙️ Settings — opened to a specific view via a `hub-view` event from the popover's icon buttons or the pet's right-click menu. Hidden windows hide (rather than close) when dismissed.
- **State ownership**: `src/ui/stats.js` is the single owner of persistent state. It runs the game clocks and writes `save.json` (via Rust `save_state`/`load_state`) to `~/Library/Application Support/com.junhe.mypet/`. Other windows never write state: they emit events (`use-item`, `buy-cart`, `start-plan`, `end-activity`, `hire-caretakers`, `end-caretaking`, `bank-op`, `pika-checkout`, `gov-update`, `gov-magic`, `settings-changed`, …); stats.js validates, applies, saves, and broadcasts `pet-state`, which every window consumes.
- **Persistence model**: saved every tick, restored verbatim — intentionally **no offline decay**, and activity/shift timers store elapsed time so they pause while the app is closed. Bank interest is the one exception: it compounds per calendar day, including days offline.
- **Background throttling caveat**: WebKit suspends JS (timers *and* event delivery) in hidden webviews, so the main/stats/hub windows all set `"backgroundThrottling": "disabled"` in `tauri.conf.json`. The hub additionally re-syncs from the save file on window focus. All windows report errors to stdout via the Rust `log` command.
- **UI assets are embedded in the binary at compile time** — after editing anything in `src/ui/`, rebuild (`cargo build` from the repo root). Extension pages are the exception: they live in the user's extensions directory and update by reinstalling the zip, no app restart needed.
- **Duplicate top-level `const` across `<script>` files kills a page silently** (parse error before any error hook runs). Sanity check: `cat items.js panel.js school.js career.js touring.js hub.js | node --check /dev/stdin`.
- **Sprite animation** is pure CSS `steps()` over `background-position`; JS switches the `data-anim` attribute (`idle`, `run-left`, `run-right`, `sad`) and swaps the sheet image per species.
- **Extensions** each run in their own real Tauri child webview (hub-hosted page) or window (popups), gated by a per-extension Tauri capability generated from that extension's own declared permissions — not a shared, ungated dispatcher. See `doc/extensions.md` for the manifest schema, permission catalog, and how the Marketplace's signed installs work.
- **App auto-update** (`src/updates.rs`) checks/downloads/installs in the background and exposes a "Restart to Update" state the hub's topbar reacts to — see `doc/roadmap.md`. **Still placeholder as of this writing**: `tauri.conf.json`'s `plugins.updater.pubkey` and the `<owner>/<repo>` in its `endpoints` URL need real values before this does anything but fail closed.
