# 🧭 Roadmap, Debug Knobs & To-Do

## ⬆️ Important: auto-update (Chrome/VSCode-style) — not yet implemented

Goal: the app silently notices a new release, downloads it in the background, shows a subtle **update badge**, and applies it on "Restart & Update" — exactly like Chrome/VSCode/Discord. Implementation plan:

1. **Plumbing**: use the official `tauri-plugin-updater`. Generate a signing keypair with `tauri signer generate`; put the public key + update endpoint in `tauri.conf.json` (`plugins.updater`). CI builds the release, signs the artifacts, and publishes them plus a `latest.json` manifest (version, notes, per-platform URLs + signatures) — GitHub Releases works as the host, with `latest.json` at a stable URL.
2. **Check & download**: at launch and every ~6 hours (the stats window's clock is the natural home), call the updater's `check()`; if an update exists, `download()` it in the background — never interrupt the user.
3. **Badge placement (suggestion)**: once downloaded, show a small ⬆️ badge on the **popover header** (next to the pet's name — the one surface the user sees daily) and a highlighted row at the top of **Settings**: "🎁 Version X.Y is ready — Restart & Update". Optionally the pet says "I learned new tricks, ⟨callMe⟩!" once.
4. **Apply**: the button calls the updater's `install()` (which swaps the app bundle) followed by relaunch — the plugin handles the swap-on-restart dance. Save-file compatibility is already covered by the tolerant loaders/migrations.
5. **Platform notes**: macOS requires the app to be **signed (Developer ID) and notarized** for the updater to replace it; Windows uses the NSIS/MSI updater artifacts; Linux AppImage. Dev builds should skip checks (`cfg!(debug_assertions)`).

## Other knobs & to-dos

| Where | Current state | To-do |
|---|---|---|
| **🥊 Darcy's Fight Club** | LIVE (see [hub.md](hub.md)): turn-based word fights vs the 20 kitchen customers with animated HP bars, 50 skills × 5 levels (40 active / 10 passive), fight level + XP with book rewards, HP recovery, 5-tier Skill Books + healing supplies (Pika's Fighter's Corner tab), moneyline side bets (the old ⚔️ Adventure and 🥊 Arena views were retired in the cat-business redesign; git history keeps the prototypes) | Balance pass after real play; async friend battles via shareable fight codes (the Arena prototype's best idea); maybe fight achievements on the wall |
| **🍳 Noonie's Kitchen** | LIVE: 3h order board, pantry + Organic Market, 190 city recipe scrolls (20% tour drop, Pika sells 2/refresh), 10 paw-bots (2 free, rising unlock prices), tiered Skill Book drops (~16%/delivery) | Balance pass (order rewards vs. job pay); hand-tune generated city-recipe ingredient lists (they're procedurally drawn from per-country pools, so a dessert can currently ask for squid); translate the 190 dish names |
| Localization: misc | Rust-side tray menu ("Quit") and window titles set in `tauri.conf.json` are English-only; installed add-ons other than Music Player don't implement `get-locale` yet | Read the saved language in `main.rs` for the tray item; update add-on zips per [addons.md](addons.md) |
| Game speed | Settings → Developer mode toggles fast/normal at runtime | — |
| Save file | Debug-boosted coins from development | Fresh games start at 1000 |
| Economy balance | Prices/pay/XP hand-tuned | Balance pass with real playtime data |
| Health at 0 | Nothing special happens | Death/urgent-care state |
| Sprite sheets | Only 4 of 11 rows used (idle/run×2/sad) | Wave, pounce, sleepy, curled… for idle variety and interactions |
| Add-on bridge | Fixed allowlist (`get-locale`, `pick-folder`, `list-music`, `file-url`, `say`, `notify`, `open-window`, `widget-set`, `widget-push`), no permission prompts | Permissioned API for third-party add-ons |
| Souvenirs | One 🎁 emoji for all | Per-city souvenir art |
| Platform | Developed/tested on macOS only | Windows/Linux need testing (tray, transparency, Spaces, Launch Agent equivalents) |
