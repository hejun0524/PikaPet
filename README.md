# 🐾 Pika Pet

A cross-platform desktop pet (in the spirit of QQ Pet, with a Codex-pet-style companion vibe), built with [Tauri v2](https://tauri.app). A pet — Chocolate Toy Poodle 🐩 or White Cat 🐈 — lives on your desktop, talks to you in speech bubbles, goes to school, works jobs, tours the world, and reports back through a macOS menu bar popover. Zip-installable add-ons extend it (see [ADDONS.md](ADDONS.md)). The UI speaks six languages (see "Languages" below).

## Getting Started

### Prerequisites

| Tool | Install | Notes |
|---|---|---|
| Rust (stable) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | Compiles the Tauri backend |
| Xcode Command Line Tools (macOS) | `xcode-select --install` | C toolchain for the Rust build |
| Linux only: WebKitGTK dev packages | see [Tauri prerequisites](https://tauri.app/start/prerequisites/) | Not needed on macOS/Windows |

No Node.js required — the frontend is plain vanilla JS with no build step.

### Run

```bash
git clone <this repo>
cd backend
cargo run          # compile + launch (first build takes a few minutes)
```

First launch opens a Welcome window: pick a species (free), name your pet, tell it what to call you.

### Build a distributable app

```bash
cargo install tauri-cli --version "^2"   # one-time
cd backend
cargo tauri build                        # outputs to backend/target/release/bundle/
```

On macOS this produces a `.app` for /Applications; Settings → "Show up when computer starts" registers it as a Launch Agent.

## Project Structure

```
mypetgame/
├── pets/                     # Source artwork (spritesheets, 8×11 grids of 192×208 frames)
│   ├── toy_poodle.webp
│   ├── white_cat.webp
│   └── bichon.webp
├── addons/                   # Add-on zips for development (NOT bundled into the app)
│   └── music.zip             #   the Music Player add-on (manifest + entry page)
├── frontend/                 # All UI — plain HTML/CSS/JS, no bundler (EMBEDDED in the binary)
│   ├── index.html/main.js/style.css    # Desktop pet window: sprite animation, drag, speech bubbles, travel runs, context menu
│   ├── stats.html/stats.js/stats.css   # Menu bar popover + THE STATE OWNER: game clocks, save/load, all mutations
│   ├── hub.html/hub.js/hub.css         # Hub window: Home / Life / Career / Touring / Achievements / Pet Center / Pika / Adventure / Add-ons / Settings + add-on host
│   ├── addon-window.html/.js # Shell for add-on popup windows (iframe + bridge)
│   ├── setup.html/setup.js/setup.css   # First-run welcome window (choose pet, name, call-me)
│   ├── items.js              # Shared catalog: items, prices, stores, caretakers, bank rates, species, add-on helpers
│   ├── school.js             # Shared school data: stages, subjects, courses, progression helpers
│   ├── career.js             # Shared career data: careers, generated job ranks, tier/level helpers
│   ├── touring.js            # Shared touring data: destinations, leagues, tours, tickets, Pika constants
│   ├── panel.js / panel.css  # Shared pet-panel rendering (meters/traits/pocket/status/add-on buttons)
│   ├── shared/               # Cross-window plumbing: tauri.js (API access), i18n.js (t()/tOr()), names.js (translated catalog names), jlog.js
│   ├── locales/              # One dictionary per language: en / zh / fr / es / de / ja
│   └── pets/                 # Runtime copies of the spritesheets (what the app actually loads)
├── backend/                  # Tauri v2 Rust application
│   ├── src/main.rs           # Windows, tray, menus, save-file/reset commands, add-on install/scan, music scan
│   ├── tauri.conf.json       # App config: the four windows, asset protocol scope
│   ├── capabilities/default.json   # Security allowlist: which APIs the JS may call
│   └── icons/                # Paw app icons + monochrome paw tray template
├── scripts/
│   └── i18n-check.mjs        # Headless localization check (run after touching locales/)
└── ADDONS.md                 # How to package an add-on zip
```

### Architecture notes

- **Four windows**: `main` (transparent, always-on-top pet), `stats` (popover under the tray icon), `hub` (a normal resizable window, min 700×480, responsive card grid, VSCode-style draggable side-panel splitter), and `setup` (first run only). The hub has eleven views — 🏠 Home / 🧺 Life / 💼 Career / 🗺️ Touring / 🏆 Achievements / 💖 Pet Center / 🐱 Pika / ⚔️ Adventure / 🥊 Arena / 🧩 Add-ons / ⚙️ Settings — opened to a specific view via a `hub-view` event from the popover's icon buttons or the pet's right-click menu. Hidden windows hide (rather than close) when dismissed. The Adventure view's design doc lives in [ADVENTURE.md](ADVENTURE.md).
- **State ownership**: `frontend/stats.js` is the single owner of persistent state. It runs the game clocks and writes `save.json` (via Rust `save_state`/`load_state`) to `~/Library/Application Support/com.junhe.mypet/`. Other windows never write state: they emit events (`use-item`, `buy-cart`, `start-plan`, `end-activity`, `hire-caretakers`, `end-caretaking`, `bank-op`, `pika-checkout`, `gov-update`, `gov-magic`, `settings-changed`, …); stats.js validates, applies, saves, and broadcasts `pet-state`, which every window consumes.
- **Persistence model**: saved every tick, restored verbatim — intentionally **no offline decay**, and activity/shift timers store elapsed time so they pause while the app is closed. Bank interest is the one exception: it compounds per calendar day, including days offline.
- **Background throttling caveat**: WebKit suspends JS (timers *and* event delivery) in hidden webviews, so the main/stats/hub windows all set `"backgroundThrottling": "disabled"` in `tauri.conf.json`. The hub additionally re-syncs from the save file on window focus. All windows report errors to stdout via the Rust `log` command.
- **Frontend assets are embedded in the binary at compile time** — after editing anything in `frontend/`, rebuild (`cargo build` from `backend/`). Add-on pages are the exception: they live in the user's addons directory and update by reinstalling the zip, no app restart needed.
- **Duplicate top-level `const` across `<script>` files kills a page silently** (parse error before any error hook runs). Sanity check: `cat items.js panel.js school.js career.js touring.js hub.js | node --check /dev/stdin`.
- **Sprite animation** is pure CSS `steps()` over `background-position`; JS switches the `data-anim` attribute (`idle`, `run-left`, `run-right`, `sad`) and swaps the sheet image per species.

## Languages

The whole UI is localized into **English, Chinese (中文), French, Spanish, German, and Japanese**. Settings → 🌐 **Language** picks one; the default, **System language**, follows the OS (unsupported system languages fall back to English). Changes apply live to every window — popover, hub, speech bubbles, the pet's right-click menu, and localized add-ons — no restart.

How it works:

- `frontend/shared/i18n.js` holds the active locale and two lookups: `t(key, params)` for UI strings and `tOr(key, fallback)` for data-catalog names. The setting travels as `pet.settings.language` through the normal `settings-changed` → save → `pet-state` flow, so every window stays in sync.
- `frontend/locales/<code>.js` is one flat dictionary per language. `en.js` lists only UI strings — it is the master key list and the universal fallback.
- The **data catalogs stay English-only** (`items.js`, `school.js`, `career.js`, `touring.js` are untouched — English keys are also what `save.json` stores); other locales translate their names under stable keys (`item.carrot`, `class.math-grade`, `job.chef-3`, `dest.japan`, …) and `frontend/shared/names.js` resolves them at render time. A missing entry silently falls back to the catalog's English name, so partial translations are safe.
- **Cities and team names are translated too**, keyed by their exact English catalog string (`city.New York`, `city.Boston Celtics`). Chinese and Japanese translate all ~315 of them; French/Spanish/German list only real exonyms (Londres, Nueva York, Peking, …) and keep sports team names in their original English form, which is how sports media in those languages write them. Everything not listed falls back to the English name.
- Deliberately **not** translated: league names (NBA, MLB, …) and the pet-name defaults. Achievements stored in `save.json` keep English labels (they're data); the Achievements wall renders localized labels from keys.
- Add-ons localize themselves via the bridge (`get-locale` + the `app-locale` push) — see [ADDONS.md](ADDONS.md); the Music Player is the reference implementation.

### For developers: adding a language

1. **Copy the dictionary**: `cp frontend/locales/en.js frontend/locales/<code>.js` (two-letter code, e.g. `ko.js`) and translate every value. `en.js` holds only the UI keys; for the data-name sections (`item.*`, `class.*`, `job.*`, `dest.*`, `city.*`, …) copy them from `zh.js` — it is the most complete example — and translate those too. Anything you skip falls back to English, so you can land a partial translation safely.
2. **Register it** in `frontend/shared/i18n.js`: add the import + entry to `LOCALES`, and an entry to `LANGUAGE_OPTIONS` with the label written in its own language (`{ key: "ko", label: "한국어" }`). `detectLocale()` then also matches it as a system language automatically.
3. **Rebuild** (`cargo build` from `backend/` — the frontend is embedded). The Settings dropdown picks the new language up; nothing else to wire.
4. Optionally teach the **Music Player** (and other add-ons) the new code: add an `STR` section in the zips' pages — add-ons receive the locale code via `get-locale`/`app-locale` and fall back to English for codes they don't know (see ADDONS.md).

### For developers: adding or changing strings

- New **UI text** goes into `locales/en.js` first (that file is the master key list), then into each other locale; render it with `t("your.key", {params})`. Never concatenate translated fragments — put `{placeholders}` inside the string so each language can reorder them.
- New **catalog entries** (an item, class, job, destination, city…) need no `en.js` entry — the catalog's English `name`/`label` is the fallback. Add the translated names under the entry's stable key in the non-English locales (`"item.<key>"`, `"city.<Exact English Name>"`, …) and render through the helpers in `shared/names.js` (`itemName`, `className`, `cityName`, …).
- Run **`node scripts/i18n-check.mjs`** after touching `locales/` or the catalogs — it verifies every locale against `en.js` (missing keys, `{placeholder}` typos, data keys pointing at nonexistent catalog entries) and exercises the render helpers under every language. It's the same check this feature was shipped with; keep it green.

## Functionality

**Desktop pet**
- Transparent, frameless, always-on-top sprite; hidden from the Dock (menu bar app only). Species swappable at the Magic Station.
- Native drag with direction-facing run animation; snaps back on-screen if dropped off an edge; spawns where it was last left (bottom-right fallback if that spot is now off-screen).
- Sad animation when Mood < 35%; **speech bubbles** (with a pointer arrow) greet you by time of day, complain when needs run low (3-min cooldown), announce tours, and list the cities visited on return — always addressing you by your chosen `callMe`.
- During tours the pet **runs off the nearer screen edge**, disappears, and later runs back in from a random edge.
- Right-click menu: all seven hub views, 🛑 End Activity / 📢 Call Back, 🛎️ End Caretaking, ⚙️ Settings…, Quit — rebuilt per popup so End items grey out when there's nothing to end (and End Activity greys while a caretaker is on duty).

**Menu bar (tray)**
- Monochrome paw-print template icon (drawn programmatically with Swift/CoreGraphics); the app icon set is the same paw on a warm rounded square. Left-click toggles the popover (rounded, with a pointer arrow at the tray icon); right-click has a plain Quit item.
- Popover shows: name + breed + 💰 pocket coins in the header, avatar, four care cards whose background fill rises with the meter (threshold-colored), three equal trait cards (value, emoji, name), compact status rows for the current activity and caretaker shift (each with its 🛑/📢 button, activity-end disabled while caretaken), a **"World"** section of view buttons (4 per row), and a **Quick Launch** section with one button per installed add-on. The hub's left panel mirrors the same layout. A **▾ minimize toggle** (top right) collapses the popover to the essentials: slim emoji+bar care meters (no numbers) plus 🏠 Home / 🧩 Add-ons / ⚙️ Settings buttons; the window height hugs the content in both modes.

**Care & stats**
- Energy ⚡, Hygiene 🛁, Mood 😊 decay by 1 per tick (`TICK_MS`); colors green → yellow (<60%) → orange (<35%) → red (<15%).
- Health ❤️ drains −1/tick per critical meter; below 80 the pet is **sick** 🤒: school/work/travel blocked until healed (meds, Full Recovery).
- Traits: Fitness 💪, Smarts 📚, Charm ✨ — raised by homework, school, and used by job requirements.

**Hub — Home** 🏠: seven tabs — Food, Bath, Toys, Meds, Homework, Tickets 🎫, Souvenirs 🎁. Items apply instantly (capped at 100) and disappear at quantity 0; homework trades −5/−5 care for +1 trait, all at 💰25, **max 5 per day** (counter shown in the tab, resets at midnight); tickets launch trips; souvenirs are tour trophies Pika buys at 💰200 each.

**Hub — Life** 🧺: five stores (Food 11 items, Bath 8, Toys 8, Hospital 6 incl. 💰200 Full Recovery, Homework 6) with a fly-to-cart animation and an atomic checkout that greys out when unaffordable.

**Hub — Career** 💼: School and Job share one plan book and one activity clock.
- **School**: 7 subjects × 7 stages (Kindergarten → PhD, 26 years/subject), per-subject credits (10→110 per year by stage), 49 courses, stage-gated 🔒, diplomas on the Achievements wall.
- **Job**: 12 careers × 5 generated ranks; per-career XP in 5 tiers × 5 levels; ranks unlock by level/traits/degrees; tier completions are achievements.
- **📔 Plan book**: stage classes/jobs like a cart, ▶ Start (greyed if up-front costs exceed pocket); charges land as each activity starts; ending early prorates and refunds.

**Hub — Touring** 🗺️: 27 destinations (~190 cities) + 5 sports leagues with full rosters (NBA/WNBA/NFL/MLB/CBA, 125 teams). Mystery packages (1-5 stops; 💰70/city, 💰150/team stop) draw uniformly across *everything* and reveal stops only on completion. Care is frozen during trips and **fully recharged** on any trip that visited ≥1 stop. Journals record "Country - City" / "League - Team" per stop under 🌍/🏟️; city maps light up; each stop yields a souvenir. Call back = ⌊elapsed/30min⌋ stops visited, rest refunded.

**Hub — Adventure** ⚔️: the pet's second life as a guildmaster — part of the app (not an add-on) but a fully separate, novel-styled ecosystem (serif type; Finnies 🐟 ≠ coins; own localStorage save; reads only the pet's name). Six tabs — Guild (NPC notice board + story chronicle), World (Finder-style three-column browser: 5 eras → cities + wilderness → gathering dispatch and familiar-face sightings), Storehouse (materials/trinkets inventory), Crafthouse (all crafts listed; blueprint purchases unlock benches permanently, the rest greyed out), and the three cats right-aligned: Pika (blueprint shop + trinket buy-back), Darcy (whereabouts ledger, paid locates, the Express), Noonie (HR & Talent Acquisition: roster, hiring pool, instant healing). Answer one notice for an NPC and you'll spot them yourself when browsing their city; Darcy just finds them faster. Full design + to-dos in [ADVENTURE.md](ADVENTURE.md).

**Hub — Arena** 🥊: 大乐斗-style asynchronous pet fights (code in `frontend/arena/`). Live today: fight cards derived from the real pet (Fitness → HP/ATK, Smarts → ATK/DEF, Charm → SPD/Luck, scaled ±15% by care "Condition"), rerollable sparring rivals, and serverless **fight codes** (base64 card snapshots pasted over any chat app — the friend never needs to be online). Pending: the battle engine (`arena/simulateBattle.js` stub documents the constraints — turn-based, seeded, deterministic so both sides replay identical fights), sprite-animated replays, rewards, and an optional free-tier friend directory.

**Hub — Achievements** 🏆: four tabs (Degrees 49, Career Tiers 60, World Touring 27, Sports Touring 5) listing everything earnable; earned rows show their date; backfilled from progress on load.

**Hub — Pika** 🐱: "Sell to Pika" / "Buy from Pika" tabs with a 🤝 trade basket — mix souvenir sales (💰200 each) and ticket purchases (city flights, country trains, team tickets, league passes at randomized prices) into one atomic checkout whose net can be in your favor. Store refreshes every 3 hours.

**Hub — Pet Center** 💖: four tabs:
- **📋 Registry** — name + call-me changes, 💰50 fee (breed is preset by species).
- **🏦 Bank** — savings 5.0% APR, loans 15.0% APR (limit 💰50k), daily compounding; panels show pocket cash only.
- **🧑‍🍼 Caretakers** — six automated 4-game-hour services hired via the 🛎️ basket: Pet Sitter 💰300 (auto-feeds from inventory, buys at plain cost), Home Teacher 💰500 (advances the most-behind subject), Job Manager 💰500 (best-paying unlocked job in the top career), Tour Guide 🚩 💰800 (city tours, tickets first), Sports Agent 🎽 💰1000 (sports tours), Super AI Butler 🤖 💰1200 (sitter care + class→job→city tour→class→job→sports tour rotation). Behavior is data-driven from the catalog; End Service refunds prorated; caretakers outrank manual End Activity.
- **🔮 Magic Station** — forms are owned: buy once (Toy Poodle 💰6666, White Cat 💰6767, Bichon Frisé 💰5888; purchase switches you immediately, with a confirmation page), then switch between owned forms anytime for free.

**Hub — Settings** ⚙️: two boxless sections — **General** (pet size as a % number field, 🌐 Language dropdown, show-on-all-desktops, launch-at-startup, Hide-my-pet checkbox, plus "Quit the app" / "Reset all data…" as red links; reset requires typing the pet's name and restarts into first-run) and **Developer mode** (fast game time — care decays every 10s, 1 game-minute = 5s — and auto-topped-up coins; applies live to newly started activities). Add-ons are managed from the 🧰 manager on the Add-ons homepage.

**First run / reset**: a Welcome window replaces the pet — choose a species (free, with per-species default names), set name and call-me, "Let's go! 🎉". Nothing is written to disk until setup completes; quitting keeps the app in the first-run state.

**Add-ons** 🧩 (developer guide: [ADDONS.md](ADDONS.md))
- **🧩 Add-ons homepage**: an iPhone-style springboard of app tiles in the hub; its 🧰 manager (top-right, like the cart button) is where add-ons are installed ("📦 Install add-on from zip…", native file picker), uninstalled (🗑️), and 📌 **pinned** — only pinned add-ons appear in the Quick Launch rows of the tray popover and hub side panel (rows hide entirely when nothing is pinned). The open add-on's Quick Launch button highlights like the World buttons. Zips extract to `~/Library/Application Support/com.junhe.mypet/addons/<id>/`; the app rescans at startup and after every change.
- Add-on pages render in sandboxed iframes hosted *outside* the view grid — one live iframe per opened add-on, so several can run at once and keep running (e.g. music keeps playing) while you browse other pages or close the hub. They talk to the app through a **postMessage bridge** (`pick-folder`, `list-music`, `file-url`, `notify`, `open-window`, `widget-set`, `widget-push` — see ADDONS.md).
- **Tray widgets**: an add-on with a `widget` page in its manifest can hang a mini rounded box below the menu-bar popover (multiple widgets stack in activation order; the popover window grows to fit). Add-ons can also open their own popup windows (`addon-window.html` shell) and send macOS push notifications (osascript).
- **🎹 Music Player** (`addons/music.zip`): choose a folder with a native picker, recursive scan (mp3/m4a/aac/wav/flac/ogg), a uniform monochrome-icon transport bar — prev / play-pause / next / shuffle / loop-playlist / repeat-one — draggable seek bar, Play All, and a mini-player tray widget (title + prev/play/next) that appears once playback starts. Fully localized in all six app languages (the reference for the `get-locale` / `app-locale` bridge contract). Updating the add-on = reinstalling the zip — no app rebuild or restart.

## Debug knobs & To-Do

### ⬆️ Important: auto-update (Chrome/VSCode-style) — not yet implemented

Goal: the app silently notices a new release, downloads it in the background, shows a subtle **update badge**, and applies it on "Restart & Update" — exactly like Chrome/VSCode/Discord. Implementation plan:

1. **Plumbing**: use the official `tauri-plugin-updater`. Generate a signing keypair with `tauri signer generate`; put the public key + update endpoint in `tauri.conf.json` (`plugins.updater`). CI builds the release, signs the artifacts, and publishes them plus a `latest.json` manifest (version, notes, per-platform URLs + signatures) — GitHub Releases works as the host, with `latest.json` at a stable URL.
2. **Check & download**: at launch and every ~6 hours (the stats window's clock is the natural home), call the updater's `check()`; if an update exists, `download()` it in the background — never interrupt the user.
3. **Badge placement (suggestion)**: once downloaded, show a small ⬆️ badge on the **popover header** (next to the pet's name — the one surface the user sees daily) and a highlighted row at the top of **Settings**: "🎁 Version X.Y is ready — Restart & Update". Optionally the pet says "I learned new tricks, ⟨callMe⟩!" once.
4. **Apply**: the button calls the updater's `install()` (which swaps the app bundle) followed by relaunch — the plugin handles the swap-on-restart dance. Save-file compatibility is already covered by the tolerant loaders/migrations.
5. **Platform notes**: macOS requires the app to be **signed (Developer ID) and notarized** for the updater to replace it; Windows uses the NSIS/MSI updater artifacts; Linux AppImage. Dev builds should skip checks (`cfg!(debug_assertions)`).

### Other knobs & to-dos

| Where | Current state | To-do |
|---|---|---|
| **Localization: Arena & Adventure** | The app UI is localized (en/zh/fr/es/de/ja), but the ⚔️ Adventure world (`frontend/adventure.js` + `adventure/`) and 🥊 Arena (`frontend/arena.js` + `arena/`) still render **English-only** — deliberately left untouched for now (huge narrative string surface in Adventure; Arena's engine is still being built) | Extract their strings through `shared/i18n.js` the same way (their view **titles** in the nav are already translated) |
| Localization: misc | Rust-side tray menu ("Quit") and window titles set in `tauri.conf.json` are English-only; installed add-ons other than Music Player don't implement `get-locale` yet | Read the saved language in `main.rs` for the tray item; update add-on zips per ADDONS.md |
| Game speed | Settings → Developer mode toggles fast/normal at runtime | — |
| Save file | Debug-boosted coins from development | Fresh games start at 1000 |
| Economy balance | Prices/pay/XP hand-tuned | Balance pass with real playtime data |
| Health at 0 | Nothing special happens | Death/urgent-care state |
| Sprite sheets | Only 4 of 11 rows used (idle/run×2/sad) | Wave, pounce, sleepy, curled… for idle variety and interactions |
| `frontend/pets/` | Manual copy of `pets/*.webp` | Sync step so artwork edits don't need a re-copy |
| Add-on bridge | Fixed allowlist (`pick-folder`, `list-music`, `file-url`, `notify`, `open-window`, `widget-set`, `widget-push`), no permission prompts | Permissioned API for third-party add-ons |
| Souvenirs | One 🎁 emoji for all | Per-city souvenir art |
| Platform | Developed/tested on macOS only | Windows/Linux need testing (tray, transparency, Spaces, Launch Agent equivalents) |
