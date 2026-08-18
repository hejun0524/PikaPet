# 🏗️ Architecture

## Project structure

```
PikaPet/                      # The Tauri v2 Rust crate lives at the repo root: `cargo run` here
├── Cargo.toml / build.rs     # Crate manifest + tauri-build hook
├── tauri.conf.json           # App config: the four windows, asset protocol scope, frontendDist = src/ui
├── capabilities/default.json # Security allowlist: which APIs the JS may call
├── icons/                    # Paw app icons + monochrome paw tray template
├── src/
│   ├── main.rs               # Windows, tray, menus, save-file/reset commands, extension install/scan, music scan
│   └── ui/                   # All UI — plain HTML/CSS/JS, no bundler (EMBEDDED in the binary)
│       ├── index.html/main.js/style.css    # Desktop pet window: sprite animation, drag, speech bubbles, travel runs, context menu
│       ├── stats.html/stats.js/stats.css   # Menu bar popover + THE STATE OWNER: game clocks, save/load, all mutations
│       ├── hub.html/hub.js/hub.css         # Hub window: Home / Life / Career / Touring / Achievements / Pet Center / Pika's Trading Post / Fight Club / Delivery / Extensions / Settings + extension host
│       ├── extension-window.html/.js # Shell for extension popup windows (iframe + bridge)
│       ├── setup.html/setup.js/setup.css   # First-run welcome window (choose pet, name, call-me)
│       ├── items.js              # Shared catalog: items, prices, stores, caretakers, bank rates, species, extension helpers
│       ├── school.js             # Shared school data: stages, subjects, courses, progression helpers
│       ├── career.js             # Shared career data: careers, generated job ranks, tier/level helpers
│       ├── touring.js            # Shared touring data: destinations, leagues, tours, tickets, Pika constants
│       ├── kitchen.js            # Shared kitchen data: ingredients, recipes (8 basic + generated city dishes), paw-bots, skill books
│       ├── panel.js / panel.css  # Shared pet-panel rendering (meters/traits/pocket/status/extension buttons)
│       ├── shared/               # Cross-window plumbing: tauri.js (API access), i18n.js (t()/tOr()), names.js (translated catalog names), jlog.js
│       ├── locales/              # One dictionary per language: en / zh / fr / es / de / ja
│       └── pets/                 # The spritesheets (8×11 grids of 192×208 frames; single source of truth)
├── extensions/                   # Extension zips for development (NOT bundled into the app)
│   └── music.zip             #   the Music Player extension (manifest + entry page)
├── scripts/
│   └── i18n-check.mjs        # Repo-level dev tooling (not app source): headless localization check
└── doc/                      # This documentation (linked from the README's table)
```

The JS is organized as browser ES modules with **one function per file**: each window has an entry file (`hub.js`, `stats.js`, `main.js`, `setup.js`, `extension-window.js`) plus a folder of per-function modules (`hub/`, `stats/`, …); the old shared filenames (`items.js`, `school.js`, …) remain as master files that only re-export. Mutable state lives in each window's `state.js`.

## Architecture notes

- **Four windows**: `main` (transparent, always-on-top pet), `stats` (popover under the tray icon), `hub` (a normal resizable window, min 700×480, responsive card grid, VSCode-style draggable side-panel splitter), and `setup` (first run only). The hub has eleven views — 🏠 Home / 🧺 Life / 💼 Career / 🗺️ Touring / 🏆 Achievements / 💖 Pet Center / 🐱 Pika's Trading Post / 🥊 Darcy's Fight Club / 🚚 Noonie's Delivery Service / 🧩 Extensions / ⚙️ Settings — opened to a specific view via a `hub-view` event from the popover's icon buttons or the pet's right-click menu. Hidden windows hide (rather than close) when dismissed.
- **State ownership**: `src/ui/stats.js` is the single owner of persistent state. It runs the game clocks and writes `save.json` (via Rust `save_state`/`load_state`) to `~/Library/Application Support/com.junhe.mypet/`. Other windows never write state: they emit events (`use-item`, `buy-cart`, `start-plan`, `end-activity`, `hire-caretakers`, `end-caretaking`, `bank-op`, `pika-checkout`, `gov-update`, `gov-magic`, `settings-changed`, …); stats.js validates, applies, saves, and broadcasts `pet-state`, which every window consumes.
- **Persistence model**: saved every tick, restored verbatim — intentionally **no offline decay**, and activity/shift timers store elapsed time so they pause while the app is closed. Bank interest is the one exception: it compounds per calendar day, including days offline.
- **Background throttling caveat**: WebKit suspends JS (timers *and* event delivery) in hidden webviews, so the main/stats/hub windows all set `"backgroundThrottling": "disabled"` in `tauri.conf.json`. The hub additionally re-syncs from the save file on window focus. All windows report errors to stdout via the Rust `log` command.
- **UI assets are embedded in the binary at compile time** — after editing anything in `src/ui/`, rebuild (`cargo build` from the repo root). Extension pages are the exception: they live in the user's extensions directory and update by reinstalling the zip, no app restart needed.
- **Duplicate top-level `const` across `<script>` files kills a page silently** (parse error before any error hook runs). Sanity check: `cat items.js panel.js school.js career.js touring.js hub.js | node --check /dev/stdin`.
- **Sprite animation** is pure CSS `steps()` over `background-position`; JS switches the `data-anim` attribute (`idle`, `run-left`, `run-right`, `sad`) and swaps the sheet image per species.
