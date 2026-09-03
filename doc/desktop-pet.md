# 🐩 Desktop Pet, Tray & Care

## Desktop pet

- Transparent, frameless, always-on-top sprite; hidden from the Dock (menu bar app only). Species swappable at the Magic Station (custom uploads and the earned Legendary Cats load their sheets from `<data>/pets/` / the catalog `sheet` field).
- **Click-through margins**: only the sprite itself catches the mouse. The webview reports the pet's bounding box (`set_pet_hitbox`, refreshed every 500 ms), and a Rust watcher polls the global cursor at ~12 Hz, toggling `set_ignore_cursor_events` so clicks on the window's transparent padding (the speech-bubble headroom and side margins) fall through to the desktop underneath.
- Native drag with direction-facing run animation; snaps back on-screen if dropped off an edge; spawns where it was last left (bottom-right fallback if that spot is now off-screen).
- **Speech bubbles** (with a pointer arrow) greet you by time of day, complain when needs run low (3-min cooldown), announce tours, and list the cities visited on return — always addressing you by your chosen `callMe`.
- **Animations** — kept deliberately minimal: only 4 of the spritesheet's 11 rows are wired up (idle, run-right, run-left, sad; the row map and the note on the planned future 4-row sheet live atop `src/ui/style.css`). Design goal: a *calm* pet that mostly sits in plain idle and never distracts.
  - *Resting states* (`main/idleAnim.js`): 😞 sad when Mood < 35%, else idle.
- During tours the pet **runs off the nearer screen edge**, disappears, and later runs back in from a random edge.
- Right-click menu (`main/buildMenu.js`): all hub views, 🛑 End Activity / 📢 Call Back, 🛎️ End Caretaking, 🎯 Turn On/Off Focus Mode, ⚙️ Settings…, 🚪 Quit — rebuilt per popup so End items grey out when there's nothing to end (and End Activity greys while a caretaker is on duty). In Focus Mode (see below) it shrinks to 🧩 Extensions, 🎯 Turn Off Focus Mode, ⚙️ Settings…, 🚪 Quit — the End items are dropped entirely rather than greyed, since there's no game-facing UI left to manage them from.
- Double-click opens the hub's Home view (Extensions in Focus Mode).

## Menu bar (tray)

- Monochrome paw-print template icon (drawn programmatically with Swift/CoreGraphics); the app icon set is the same paw on a warm rounded square. Left-click toggles the popover (rounded, with a pointer arrow at the tray icon); right-click pops up the *exact same* dynamic menu as right-clicking the pet (main.rs's `on_tray_icon_event` relays it to the pet window as a `"tray-context-menu"` event, which just calls the pet's own `buildMenu()` — one menu, two entry points, never two implementations to keep in sync).
- Popover shows: name + breed + 💰 pocket coins in the header, avatar, four care cards whose background fill rises with the meter (threshold-colored), three equal trait cards (value, emoji, name), compact status rows for the current activity and caretaker shift (each with its 🛑/📢 button, activity-end disabled while caretaken), a **"World"** section of view buttons (4 per row), and a **Quick Launch** section with one button per pinned extension. The hub's left panel mirrors the same layout. A **▾ minimize toggle** (top right) collapses the popover to the essentials: slim emoji+bar care meters (no numbers) plus 🏠 Home / 🧩 Extensions / ⚙️ Settings buttons; the window height hugs the content in both modes.

## Care & stats

- Energy ⚡, Hygiene 🛁, Mood 😊 decay by 1 per tick (`TICK_MS`); colors green → yellow (<60%) → orange (<35%) → red (<15%).
- Health ❤️ drains −1/tick per critical meter; below 80 the pet is **sick** 🤒: school/work/travel blocked until healed (meds, Full Recovery).
- Traits: Fitness 💪, Smarts 📚, Charm ✨ — raised by homework, school, and used by job requirements.

## Focus Mode

A Settings toggle (`settings.focusMode`, off by default) that turns the pet
from a game into a passive, non-distracting desk companion:

- Care/stat decay freezes entirely (`stats/tick.js` skips the decay loop,
  same shape as the existing touring skip); resting/complaint reactions
  freeze too (`main/updateResting.js`, `main/maybeComplain.js`).
- The tray popover shrinks to avatar + name + 🧩 Extensions / ⚙️ Settings
  mini-buttons (`body.focus-mode` in `stats.css`) — tray widgets from
  extensions (e.g. Burrow Cleaner's stats box) are unaffected, since they
  live outside the popover's own `#panel`.
- The hub's World nav collapses to Extensions + Settings
  (`#layout.focus-mode` in `hub.css`), and `hub/setView.js` refuses to
  switch to any other view while it's on — both the UI hiding and the
  functional guard exist, so there's no page reachable through a
  leftover nav path the CSS didn't think to hide.
- The right-click menu (pet and tray alike) shrinks to 🧩 Extensions, the
  Focus Mode toggle, ⚙️ Settings…, 🚪 Quit — the End Activity/Caretaking
  items are dropped, not just greyed.

Settings always stays reachable (the escape hatch back out of Focus Mode),
and it rides the same `settings-changed`/`pet-state` broadcast every other
setting uses — no new Tauri command needed.

**Not the same thing as `devFreeze`**: Settings → Developer's `pika freeze
on` toggle reuses the exact same decay/reaction freeze as Focus Mode
(`stats/tick.js`, `main/updateResting.js`, `main/maybeComplain.js` check
both flags the same way, and both persist in `save.json`'s settings), but
`devFreeze` is a separate, testing-only flag — it doesn't collapse the
menu, the nav, or the tray popover the way Focus Mode does. Don't confuse
a frozen-but-still-full-UI pet (`devFreeze`) with an actual Focus Mode
session.

## First run / reset

A Welcome window replaces the pet — choose a species (free, with per-species default names), set name and call-me, "Let's go! 🎉". Nothing is written to disk until setup completes; quitting keeps the app in the first-run state. Settings → "Reset all data…" (type the pet's name to confirm) deletes the save and restarts into first-run.
