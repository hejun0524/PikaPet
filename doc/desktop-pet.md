# 🐩 Desktop Pet, Tray & Care

## Desktop pet

- Transparent, frameless, always-on-top sprite; hidden from the Dock (menu bar app only). Species swappable at the Magic Station (custom uploads and the earned Legendary Cats load their sheets from `<data>/pets/` / the catalog `sheet` field).
- **Click-through margins**: only the sprite itself catches the mouse. The webview reports the pet's bounding box (`set_pet_hitbox`, refreshed every 500 ms), and a Rust watcher polls the global cursor at ~12 Hz, toggling `set_ignore_cursor_events` so clicks on the window's transparent padding (the speech-bubble headroom and side margins) fall through to the desktop underneath.
- Native drag with direction-facing run animation; snaps back on-screen if dropped off an edge; spawns where it was last left (bottom-right fallback if that spot is now off-screen).
- **Speech bubbles** (with a pointer arrow) greet you by time of day, complain when needs run low (3-min cooldown), announce tours, and list the cities visited on return — always addressing you by your chosen `callMe`.
- **Animations** (all 11 spritesheet rows wired; the row map lives atop `src/ui/style.css`). Design goal: a *calm* pet that mostly sits in plain idle and never distracts.
  - *Resting states* (most urgent wins, `main/idleAnim.js`): 😴 sleep when Energy < 15%, 🥺 beg when Energy < 35%, 😞 sad when Mood < 35%, else idle.
  - *Idle variants* (`main/initIdleVariety.js`): every 1–3 min, only while showing plain idle, a few seconds of 👀 look-around; while an activity/caretaker runs, mostly 🤔 thinking (a busy pet still looks idle); at night (22:00–07:00) or after 20 min without the user touching the pet, occasional short 😴 naps.
  - *Reactions* (`main/playOnce.js` one-shots, never interrupting drags or travel): 👋 wave on boot greeting, double-click, and tour return; 🎾 pounce on toy use ("pet-react" from stats) and Fight Club wins; 😊 shy on a Pet Center rename or a caretaker hire.
- During tours the pet **runs off the nearer screen edge**, disappears, and later runs back in from a random edge.
- Right-click menu: all hub views, 🛑 End Activity / 📢 Call Back, 🛎️ End Caretaking, ⚙️ Settings…, Quit — rebuilt per popup so End items grey out when there's nothing to end (and End Activity greys while a caretaker is on duty).
- Double-click opens the hub's Home view.

## Menu bar (tray)

- Monochrome paw-print template icon (drawn programmatically with Swift/CoreGraphics); the app icon set is the same paw on a warm rounded square. Left-click toggles the popover (rounded, with a pointer arrow at the tray icon); right-click has a plain Quit item.
- Popover shows: name + breed + 💰 pocket coins in the header, avatar, four care cards whose background fill rises with the meter (threshold-colored), three equal trait cards (value, emoji, name), compact status rows for the current activity and caretaker shift (each with its 🛑/📢 button, activity-end disabled while caretaken), a **"World"** section of view buttons (4 per row), and a **Quick Launch** section with one button per pinned add-on. The hub's left panel mirrors the same layout. A **▾ minimize toggle** (top right) collapses the popover to the essentials: slim emoji+bar care meters (no numbers) plus 🏠 Home / 🧩 Add-ons / ⚙️ Settings buttons; the window height hugs the content in both modes.

## Care & stats

- Energy ⚡, Hygiene 🛁, Mood 😊 decay by 1 per tick (`TICK_MS`); colors green → yellow (<60%) → orange (<35%) → red (<15%).
- Health ❤️ drains −1/tick per critical meter; below 80 the pet is **sick** 🤒: school/work/travel blocked until healed (meds, Full Recovery).
- Traits: Fitness 💪, Smarts 📚, Charm ✨ — raised by homework, school, and used by job requirements.

## First run / reset

A Welcome window replaces the pet — choose a species (free, with per-species default names), set name and call-me, "Let's go! 🎉". Nothing is written to disk until setup completes; quitting keeps the app in the first-run state. Settings → "Reset all data…" (type the pet's name to confirm) deletes the save and restarts into first-run.
