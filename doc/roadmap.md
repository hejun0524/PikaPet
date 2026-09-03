# 🧭 Roadmap, Debug Knobs & To-Do

## ⬆️ Auto-update (Chrome/VSCode/Discord-style) — implemented

`tauri-plugin-updater` + `tauri-plugin-process`, wired in `src/updates.rs`:
checks on startup and every `updates::CHECK_INTERVAL` (4 hours — tune the
const, there's no user-facing setting for it), downloads silently, and on
macOS/Linux installs immediately in the background. **Never relaunches on
its own** — a persistent "🔄 Restart to Update" topbar button (only visible
once an update is actually ready) is what the user clicks, on their own
schedule, to `AppHandle::request_restart()` into it.

**Windows caveat, handled**: `Update::install()` there terminates the
process as part of installing (the default "passive" install mode also
carries a restart flag, so the installer relaunches the app itself once
done). Since that can't be deferred once triggered, install() only runs in
the background on macOS/Linux — on Windows the downloaded update is held
until the same "Restart to Update" click, which is what actually installs
it there.

**Both the signing key and the release repo are real now** — `tauri.conf.json`'s
`plugins.updater.pubkey` holds an actual minisign public key and `endpoints`
points at `hejun0524/PikaPet`; the matching private key lives at the
gitignored `pikapet-updater.key`. See **[doc/releasing.md](releasing.md)**
for the full build-for-macOS / build-for-Windows / sign-and-ship pipeline —
that's the maintainer-facing doc for this now, not here.

## Other knobs & to-dos

| Where | Current state | To-do |
|---|---|---|
| **🥊 Darcy's Fight Club** | LIVE (see [hub.md](hub.md)): turn-based word fights vs the 20 kitchen customers with animated HP bars, 50 skills × 5 levels (40 active / 10 passive), fight level + XP with book rewards, HP recovery, 5-tier Skill Books + healing supplies (Pika's Fighter's Corner tab), moneyline side bets (the old ⚔️ Adventure and 🥊 Arena views were retired in the cat-business redesign; git history keeps the prototypes) | Balance pass after real play; async friend battles via shareable fight codes (the Arena prototype's best idea); maybe fight achievements on the wall |
| **🍳 Noonie's Kitchen** | LIVE: 3h order board, pantry + Organic Market, 190 city recipe scrolls (20% tour drop, Pika sells 2/refresh), 10 paw-bots (2 free, rising unlock prices), tiered Skill Book drops (~16%/delivery) | Balance pass (order rewards vs. job pay); hand-tune generated city-recipe ingredient lists (they're procedurally drawn from per-country pools, so a dessert can currently ask for squid); translate the 190 dish names |
| Localization: misc | 12 UI languages; ALL bundled extension zips carry 12-language STR tables; it/pt/ar/hi/el/ko translate UI strings only (data names fall back to English); Arabic renders LTR | Translate the data catalogs for the six newest languages; RTL layout for Arabic; read the saved language in `main.rs` for the tray "Quit" item |
| Game speed | Settings → Developer tab (`pika fast-mode on`, or the equivalent checkbox) toggles fast/normal at runtime | — |
| 🎯 Focus Mode | LIVE (see [desktop-pet.md](desktop-pet.md)): freezes decay/reactions and collapses nav/menu/tray to a minimal desk-companion mode | Worth a quick visual pass to make sure `devFreeze` (Settings → Developer's `pika freeze on`, same freeze mechanism, none of the UI collapse) can't be mistaken for it during a support conversation — they look different in the UI but sound identical described out loud |
| 🛍️ Extension Marketplace | LIVE: signed, permission-scoped installs from a `registry.json` published to `hejun0524/PikaPet-Extensions` (see `doc/extensions.md`'s "Publishing to the Marketplace") | Third-party submissions are still fully manual (send the maintainer a zip, they sign + register it by hand) — no in-repo submission/review workflow yet |
| 🧹 Burrow Cleaner extension | LIVE backend (`src/extensions/cleaner.rs`): system stats, app/leftover/purge-target scanning, Trash-based deletion, macOS-only, gated by three new permissions (`system:stats`/`fs:scan`/`fs:cleanup` — see `doc/extensions.md`) | Its own extension source isn't checked into this repo despite `cleaner.rs`'s doc comment pointing at `extension-source/pikapet-cleaner/` — either add that folder or fix the comment. `sys-optimize-run`'s `purge_font_cache` action permanently deletes a cache file with no confirm step, unlike the rest of `fs:cleanup` — worth deciding if that one action should route through the same preview/confirm shape as everything else. `stats/handleWidgetRequest.js` also has a stale comment referencing a `capability.rs::BUNDLED_CLEANER_ID` constant that doesn't exist anywhere in the code — harmless, but worth a cleanup pass |
| Save file | Debug-boosted coins from development | Fresh games start at 1000 |
| Economy balance | Prices/pay/XP hand-tuned | Balance pass with real playtime data |
| Health at 0 | Nothing special happens | Death/urgent-care state |
| Sprite sheets | Only 4 of 11 rows used (idle/run×2/sad) — deliberately reduced from an earlier, larger idle-variety set (wave/pounce/nap one-shots) in the "focus mode" commit, to keep the pet calm and non-distracting | Re-introduce idle variety later if desired — the removed `main/initIdleVariety.js`/`main/playOnce.js` logic is still in git history |
| Extension bridge | LIVE: enumerated permission catalog (`doc/extensions.md`), declared in `extension.json`, checked at install time and enforced per-extension by a real Tauri capability grant on the main hub-hosted page and popup windows | Tray widgets and the widget half of the bridge still get a small fixed always-on subset (`get-locale`, `keep-awake`, `keep-awake-status`, `notify`, `sys-status-snapshot`) regardless of declared permissions — never moved onto the capability model, since it's the same handful of calls every widget has always needed |
| Souvenirs | One 🎁 emoji for all | Per-city souvenir art |
| Platform | Developed on macOS; a Windows build path now exists (`doc/releasing.md`) | Actually running/testing on Windows (tray, transparency, autostart, WebView2 quirks) is still untested; Linux untouched entirely |
