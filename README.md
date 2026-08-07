# 🐾 Pika Pet

A cross-platform desktop pet (in the spirit of QQ Pet, with a Codex-pet-style companion vibe), built with [Tauri v2](https://tauri.app). A pet — Chocolate Toy Poodle 🐩 or White Cat 🐈 — lives on your desktop, talks to you in speech bubbles, goes to school, works jobs, tours the world, and reports back through a macOS menu bar popover. Zip-installable add-ons extend it (see [ADDONS.md](ADDONS.md)).

## Getting Started

### Prerequisites

| Tool | Install | Notes |
|---|---|---|
| Rust (stable) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | Compiles the Tauri backend |
| Node.js ≥ 18 + npm | [nodejs.org](https://nodejs.org) or nvm | Only used to run the Tauri CLI; the frontend has no build step |
| Xcode Command Line Tools (macOS) | `xcode-select --install` | C toolchain for the Rust build |
| Linux only: WebKitGTK dev packages | see [Tauri prerequisites](https://tauri.app/start/prerequisites/) | Not needed on macOS/Windows |

### Run

```bash
git clone <this repo>
npm install        # installs the Tauri CLI
npm run dev        # compile + launch (first build takes a few minutes)
```

First launch opens a Welcome window: pick a species (free), name your pet, tell it what to call you.

### Build a distributable app

```bash
npm run build      # outputs to backend/target/release/bundle/
```

On macOS this produces a `.app` for /Applications; Settings → "Show up when computer starts" registers it as a Launch Agent.

## Project Structure

```
mypetgame/
├── pets/                     # Source artwork (spritesheets, 8×11 grids of 192×208 frames)
│   ├── toy_poodle.webp
│   └── white_cat.webp
├── addons/                   # Add-on zips for development (NOT bundled into the app)
│   └── music.zip             #   the Music Player add-on (manifest + entry page)
├── frontend/                 # All UI — plain HTML/CSS/JS, no bundler (EMBEDDED in the binary)
│   ├── index.html/main.js/style.css    # Desktop pet window: sprite animation, drag, speech bubbles, travel runs, context menu
│   ├── stats.html/stats.js/stats.css   # Menu bar popover + THE STATE OWNER: game clocks, save/load, all mutations
│   ├── hub.html/hub.js/hub.css         # Hub window: Home / Shopping / Career / Touring / Achievements / Pet Center / Pika / Settings + add-on host
│   ├── addon-window.html/.js # Shell for add-on popup windows (iframe + bridge)
│   ├── setup.html/setup.js/setup.css   # First-run welcome window (choose pet, name, call-me)
│   ├── items.js              # Shared catalog: items, prices, stores, caretakers, bank rates, species, add-on helpers
│   ├── school.js             # Shared school data: stages, subjects, courses, progression helpers
│   ├── career.js             # Shared career data: careers, generated job ranks, tier/level helpers
│   ├── touring.js            # Shared touring data: destinations, leagues, tours, tickets, Pika constants
│   ├── panel.js / panel.css  # Shared pet-panel rendering (meters/traits/pocket/status/add-on buttons)
│   └── pets/                 # Runtime copies of the spritesheets (what the app actually loads)
├── backend/                  # Tauri v2 Rust application
│   ├── src/main.rs           # Windows, tray, menus, save-file/reset commands, add-on install/scan, music scan
│   ├── tauri.conf.json       # App config: the four windows, asset protocol scope
│   ├── capabilities/default.json   # Security allowlist: which APIs the JS may call
│   └── icons/                # Paw app icons + monochrome paw tray template
├── ADDONS.md                 # How to package an add-on zip
└── package.json              # Just the Tauri CLI + dev/build scripts
```

### Architecture notes

- **Four windows**: `main` (transparent, always-on-top pet), `stats` (popover under the tray icon), `hub` (a normal resizable window, min 700×480, responsive card grid, VSCode-style draggable side-panel splitter), and `setup` (first run only). The hub has eight views — 🏠 Home / 🛒 Shopping / 💼 Career / 🗺️ Touring / 🏆 Achievements / 💖 Pet Center / 🐱 Pika / ⚙️ Settings — opened to a specific view via a `hub-view` event from the popover's icon buttons or the pet's right-click menu. Hidden windows hide (rather than close) when dismissed. Add-on concepts under consideration live in [IDEAS.md](IDEAS.md).
- **State ownership**: `frontend/stats.js` is the single owner of persistent state. It runs the game clocks and writes `save.json` (via Rust `save_state`/`load_state`) to `~/Library/Application Support/com.junhe.mypet/`. Other windows never write state: they emit events (`use-item`, `buy-cart`, `start-plan`, `end-activity`, `hire-caretakers`, `end-caretaking`, `bank-op`, `pika-checkout`, `gov-update`, `gov-magic`, `addon-update`, `settings-changed`, …); stats.js validates, applies, saves, and broadcasts `pet-state`, which every window consumes.
- **Persistence model**: saved every tick, restored verbatim — intentionally **no offline decay**, and activity/shift timers store elapsed time so they pause while the app is closed. Bank interest is the one exception: it compounds per calendar day, including days offline.
- **Background throttling caveat**: WebKit suspends JS (timers *and* event delivery) in hidden webviews, so the main/stats/hub windows all set `"backgroundThrottling": "disabled"` in `tauri.conf.json`. The hub additionally re-syncs from the save file on window focus. All windows report errors to stdout via the Rust `log` command.
- **Frontend assets are embedded in the binary at compile time** — after editing anything in `frontend/`, rebuild (`cargo build` / `npm run dev`). Add-on pages are the exception: they live in the user's addons directory and update by reinstalling the zip, no app restart needed.
- **Duplicate top-level `const` across `<script>` files kills a page silently** (parse error before any error hook runs). Sanity check: `cat items.js panel.js school.js career.js touring.js hub.js | node --check /dev/stdin`.
- **Sprite animation** is pure CSS `steps()` over `background-position`; JS switches the `data-anim` attribute (`idle`, `run-left`, `run-right`, `sad`) and swaps the sheet image per species.

## Functionality

**Desktop pet**
- Transparent, frameless, always-on-top sprite; hidden from the Dock (menu bar app only). Species swappable at the Magic Station.
- Native drag with direction-facing run animation; snaps back on-screen if dropped off an edge; spawns where it was last left (bottom-right fallback if that spot is now off-screen).
- Sad animation when Mood < 35%; **speech bubbles** (with a pointer arrow) greet you by time of day, complain when needs run low (3-min cooldown), announce tours, and list the cities visited on return — always addressing you by your chosen `callMe`.
- During tours the pet **runs off the nearer screen edge**, disappears, and later runs back in from a random edge.
- Right-click menu: all seven hub views, 🛑 End Activity / 📢 Call Back, 🛎️ End Caretaking, ⚙️ Settings…, Quit — rebuilt per popup so End items grey out when there's nothing to end (and End Activity greys while a caretaker is on duty).

**Menu bar (tray)**
- Monochrome paw-print template icon (drawn programmatically with Swift/CoreGraphics); the app icon set is the same paw on a warm rounded square. Left-click toggles the popover (rounded, with a pointer arrow at the tray icon); right-click has a plain Quit item.
- Popover shows: name + breed + 💰 pocket coins in the header, avatar, four care cards whose background fill rises with the meter (threshold-colored), three equal trait cards (value, emoji, name), compact status rows for the current activity and caretaker shift (each with its 🛑/📢 button, activity-end disabled while caretaken), a **"World"** section of view buttons (4 per row), and an **Add-ons** section whose buttons share the same size. The hub's left panel mirrors the same layout.

**Care & stats**
- Energy ⚡, Hygiene 🛁, Mood 😊 decay by 1 per tick (`TICK_MS`); colors green → yellow (<60%) → orange (<35%) → red (<15%).
- Health ❤️ drains −1/tick per critical meter; below 80 the pet is **sick** 🤒: school/work/travel blocked until healed (meds, Full Recovery).
- Traits: Fitness 💪, Smarts 📚, Charm ✨ — raised by homework, school, and used by job requirements.

**Hub — Home** 🏠: seven tabs — Food, Bath, Toys, Meds, Homework, Tickets 🎫, Souvenirs 🎁. Items apply instantly (capped at 100) and disappear at quantity 0; homework trades −5/−5 care for +1 trait, all at 💰25, **max 5 per day** (counter shown in the tab, resets at midnight); tickets launch trips; souvenirs are tour trophies Pika buys at 💰200 each.

**Hub — Shopping** 🛒: five stores (Food 11 items, Bath 8, Toys 8, Hospital 6 incl. 💰200 Full Recovery, Homework 6) with a fly-to-cart animation and an atomic checkout that greys out when unaffordable.

**Hub — Career** 💼: School and Job share one plan book and one activity clock.
- **School**: 7 subjects × 7 stages (Kindergarten → PhD, 26 years/subject), per-subject credits (10→110 per year by stage), 49 courses, stage-gated 🔒, diplomas on the Achievements wall.
- **Job**: 12 careers × 5 generated ranks; per-career XP in 5 tiers × 5 levels; ranks unlock by level/traits/degrees; tier completions are achievements.
- **📔 Plan book**: stage classes/jobs like a cart, ▶ Start (greyed if up-front costs exceed pocket); charges land as each activity starts; ending early prorates and refunds.

**Hub — Touring** 🗺️: 27 destinations (~190 cities) + 5 sports leagues with full rosters (NBA/WNBA/NFL/MLB/CBA, 125 teams). Mystery packages (1-5 stops; 💰70/city, 💰150/team stop) draw uniformly across *everything* and reveal stops only on completion. Care is frozen during trips and **fully recharged** on any trip that visited ≥1 stop. Journals record "Country - City" / "League - Team" per stop under 🌍/🏟️; city maps light up; each stop yields a souvenir. Call back = ⌊elapsed/30min⌋ stops visited, rest refunded.

**Hub — Achievements** 🏆: four tabs (Degrees 49, Career Tiers 60, World Touring 27, Sports Touring 5) listing everything earnable; earned rows show their date; backfilled from progress on load.

**Hub — Pika** 🐱: "Sell to Pika" / "Buy from Pika" tabs with a 🤝 trade basket — mix souvenir sales (💰200 each) and ticket purchases (city flights, country trains, team tickets, league passes at randomized prices) into one atomic checkout whose net can be in your favor. Store refreshes every 3 hours.

**Hub — Pet Center** 💖: four tabs:
- **📋 Registry** — name + call-me changes, 💰50 fee (breed is preset by species).
- **🏦 Bank** — savings 5.0% APR, loans 15.0% APR (limit 💰50k), daily compounding; panels show pocket cash only.
- **🧑‍🍼 Caretakers** — six automated 4-game-hour services hired via the 🛎️ basket: Pet Sitter 💰300 (auto-feeds from inventory, buys at plain cost), Home Teacher 💰500 (advances the most-behind subject), Job Manager 💰500 (best-paying unlocked job in the top career), Tour Guide 🚩 💰800 (city tours, tickets first), Sports Agent 🎽 💰1000 (sports tours), Super AI Butler 🤖 💰1200 (sitter care + class→job→city tour→class→job→sports tour rotation). Behavior is data-driven from the catalog; End Service refunds prorated; caretakers outrank manual End Activity.
- **✨ Magic Station** — forms are owned: buy once (White Cat 💰6767, includes transformation), then switch between owned forms for 💰200, with a confirmation page.

**Hub — Settings** ⚙️: three boxless sections — **General** (pet size as a % number field, show-on-all-desktops, launch-at-startup, Hide-my-pet checkbox, plus "Quit the app" / "Reset all data…" as red links; reset requires typing the pet's name and restarts into first-run), **Add-ons** (read-only list with 🗑️ uninstall icons + the zip installer), and **Developer mode** (a toggle: ON = fast game time — care decays every 10s, 1 game-minute = 5s; OFF = normal — 3 min per care point, real-time activities; applies live to newly started activities).

**First run / reset**: a Welcome window replaces the pet — choose a species (free, with per-species default names), set name and call-me, "Let's go! 🎉". Nothing is written to disk until setup completes; quitting keeps the app in the first-run state.

**Add-ons** 🧩 (developer guide: [ADDONS.md](ADDONS.md))
- Installed from zips: Settings → "📦 Install add-on from zip…" (native file picker); per-add-on 🗑️ uninstall icons. Zips extract to `~/Library/Application Support/com.junhe.mypet/addons/<id>/`; the app rescans at startup and after every change.
- Add-on pages render in sandboxed iframes hosted *outside* the view grid — one live iframe per opened add-on, so several can run at once and keep running (e.g. music keeps playing) while you browse other pages or close the hub. They talk to the app through a **postMessage bridge** (`pick-folder`, `list-music`, `file-url`, `notify`, `open-window`, `widget-set`, `widget-push` — see ADDONS.md).
- **Tray widgets**: an add-on with a `widget` page in its manifest can hang a mini rounded box below the menu-bar popover (multiple widgets stack in activation order; the popover window grows to fit). Add-ons can also open their own popup windows (`addon-window.html` shell) and send macOS push notifications (osascript).
- **🎹 Music Player** (`addons/music.zip`): choose a folder with a native picker, recursive scan (mp3/m4a/aac/wav/flac/ogg), a uniform monochrome-icon transport bar — prev / play-pause / next / shuffle / loop-playlist / repeat-one — draggable seek bar, Play All, and a mini-player tray widget (title + prev/play/next) that appears once playback starts. Updating the add-on = reinstalling the zip — no app rebuild or restart.

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
| Game speed | Settings → Developer mode toggles fast/normal at runtime | — |
| Save file | Debug-boosted coins from development | Fresh games start at 1000 |
| Economy balance | Prices/pay/XP hand-tuned | Balance pass with real playtime data |
| Health at 0 | Nothing special happens | Death/urgent-care state |
| Sprite sheets | Only 4 of 11 rows used (idle/run×2/sad) | Wave, pounce, sleepy, curled… for idle variety and interactions |
| `frontend/pets/` | Manual copy of `pets/*.webp` | Sync step so artwork edits don't need a re-copy |
| Add-on bridge | Fixed allowlist (`pick-folder`, `list-music`, `file-url`, `notify`, `open-window`, `widget-set`, `widget-push`), no permission prompts | Permissioned API for third-party add-ons |
| Souvenirs | One 🎁 emoji for all | Per-city souvenir art |
| Platform | Developed/tested on macOS only | Windows/Linux need testing (tray, transparency, Spaces, Launch Agent equivalents) |
