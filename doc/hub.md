# 🏘️ The Hub

The hub window ("*{pet}*'s World") holds twelve views, selected from its left panel or the tray popover's World buttons (Dune's Daily Tasks is deliberately absent from the pet's right-click menu, along with Pika/Darcy/Noonie/Achievements — kept short by design). The left panel is resizable (drag the splitter) and collapsible: the ⏴ button at its top shrinks it to an icon-only rail (the World nav + pinned-extension Quick Launch icons); the state persists. Four of them belong to the app's resident cats: **Pika** 🐱 (female, runs the trading post), **Darcy** 🐈‍⬛ (male, runs the fight club), **Noonie** 🐈 (female, runs the kitchen), and **Dune** 🏜️ (runs the daily-task board, not yet a claimable form until its streak condition is met).

## 🏠 Home

Seven tabs — Food, Bath, Toys, Meds, Homework, Tickets 🎫, Souvenirs 🎁. Items apply instantly (capped at 100) and disappear at quantity 0; homework trades −5/−5 care for +1 trait, all at 💰25, **max 5 per day** (counter shown in the tab, resets at midnight); tickets launch trips; souvenirs are tour trophies Pika buys at 💰200 each.

## 🧺 Life

Five stores (Food 11 items, Bath 8, Toys 8, Hospital 6 incl. 💰200 Full Recovery, Homework 6) with a fly-to-cart animation and an atomic checkout that greys out when unaffordable.

## 💼 Career

School and Job share one plan book and one activity clock.

- **School**: 7 subjects × 7 stages (Kindergarten → PhD, 26 years/subject), per-subject credits (10→110 per year by stage), 49 courses, stage-gated 🔒, diplomas on the Achievements wall.
- **Job**: 12 careers × 5 generated ranks; per-career XP in 5 tiers × 5 levels; ranks unlock by level/traits/degrees; tier completions are achievements.
- **📔 Plan book**: stage classes/jobs like a cart, ▶ Start (greyed if up-front costs exceed pocket); charges land as each activity starts; ending early prorates and refunds.

## 🗺️ Touring

27 destinations (~190 cities) + 5 sports leagues with full rosters (NBA/WNBA/NFL/MLB/CBA, 125 teams). Mystery packages (1-5 stops; 💰70/city, 💰150/team stop) draw uniformly across *everything* and reveal stops only on completion. Care is frozen during trips and **fully recharged** on any trip that visited ≥1 stop. Journals record "Country - City" / "League - Team" per stop under 🌍/🏟️; city maps light up; each stop yields a souvenir. Call back = ⌊elapsed/30min⌋ stops visited, rest refunded.

## 🏆 Achievements

Four tabs (Degrees 49, Career Tiers 60, World Touring 27, Sports Touring 5) listing everything earnable; earned rows show their date; backfilled from progress on load.

## 🐱 Pika's Trading Post

Three tabs. "Sell to Pika" / "Buy from Pika" share a 🤝 trade basket — mix souvenir sales (💰200 each) and purchases (city flights, country trains, team tickets, league passes, and 📜 **recipe scrolls** for Noonie's Kitchen, all at randomized prices) into one atomic checkout whose net can be in your favor; store refreshes every 3 hours. The 🥬 **Organic Market** tab sells ~47 ingredients across seven categories (veggies, meat, seafood, staples, dairy, sauces, spices), each category under its own full-row title — clicks stage units in the same 🤝 trade basket, and checkout stocks Noonie's pantry.

## 🍳 Noonie's Kitchen

Noonie 🐈 runs a restaurant staffed by **paw-bots**. Four tabs:

- **📋 Orders** — every 3 hours (same slot clock as Pika's store) 10 hungry pets — one per animal-face emoji (🐶🐱🐭🐹🐰🦊🐻🐼🐻‍❄️🐨🐯🦁🐮🐷🐸🐵🐺🐗🐴🦄) — phone in orders for dishes the kitchen knows. Cooking an order consumes its ingredients and occupies a bot for the cook time (10 min basic / 20 min city dishes); the cooked dish then needs a bot for the 15-min delivery. Delivered orders pay coins (ingredient cost ×1.8 + a tip) and log in the recent-deliveries feed. Orders a bot is working on survive board refreshes.
- **📜 Recipes** — the full catalog is always visible: a House-recipes section (8 known from day one), then every touring city's signature dish grouped by country — unlearned ones greyed out with a 🔒. Scrolls come home from tours (20% chance per visited city) or from Pika's shop (2 per refresh, 💰300–500) and show the dish, origin, ingredients, and cook time.
- **🧺 Pantry** — the ingredient inventory, stocked from the Organic Market.
- **🤖 Paw-Bots** — ten slots with cute robotic names (Chip, Bolt, Gizmo…). Two are free; the rest unlock at rising prices (💰800 → 💰60,000). Each bot card shows what it's doing.

After a successful delivery a bot sometimes brings back a **Skill Book** for Darcy's Training Room — ~16% total per delivery, with rarer tiers rarer (Paw-Print Primer 8%, Twin Fang Digest 3.5%, Deep Focus Tome 2.5%, Pick-a-Punch Playbook 1.2%, Grandmaster's Golden Scroll 0.4%).

## 🥊 Darcy's Fight Club

Darcy 🐈‍⬛ runs turn-based word fights against the same 20 pets who order from Noonie's Kitchen — the roster climbs from Rex 🐶 (level 1) to Sparkle 🦄 (level 39). Three tabs:

- **🥊 Fight Club** — the pet's fight card (fight level + XP bar, fight HP bar, W/L record, derived stats) above the challenger board with live **American/moneyline odds** per opponent (DraftKings style: −150 = risk 150 to win 100). An optional side bet (chips 💰50–5000) pays the moneyline profit on a win and is forfeited on a loss, on top of the match purse (win +💰25+7/level, lose −💰10+3/level). Clicking Fight has the stats window simulate the whole battle (`fightclub/engine.js` — single source of truth) and the hub replays the log line by line with animated HP bars, opened by a rock-paper-scissors throw for first turn. Wins pay much more XP than losses; each fight level-up awards a Paw-Print Primer, every 5th also a random Twin Fang Digest / Deep Focus Tome. After a battle the pet keeps its remaining HP and recovers 1.5% per game-minute (fights need ≥30% HP).
- **📖 Skills** — the 50-skill wall (5 levels each) in an achievements-style list: 40 **active** skills that can replace a basic attack (household mayhem like 🔫 Water Gun, 🪙 Coin Shower, 🎈 Static Balloon, 🥤 Energy Drink, 🧛 Mr. Vampire, plus MMA/BJJ/Karate/Kung-Fu moves like Armbar, Triangle Choke, Crane Kick, Drunken Fist, Dragon Tail Kick) and 10 **passives** that answer the opponent's attacks (💫 Apparent Death survives a KO at 1 HP once per fight, 🤺 Parry reflects, 🪃 Counter Strike hits back, 😸 Healing Purr regenerates). Traits feed the math: fitness → attack/guard/bonus HP, smarts → dodge + crit (crits deal 3×), charm → double turns + skill trigger chance.
- **🏋️ Training Room** — the stock of Skill Books and healing supplies with Use buttons and result messages. Book tiers: Paw-Print Primer (+1 random skill), Twin Fang Digest (+1 to two random skills), Deep Focus Tome (+2 to one random skill), Pick-a-Punch Playbook (choose the skill), Grandmaster's Golden Scroll (choose a skill → max). Healing: Tuna Bandage 30%, Catnip Compress 60%, Phoenix Purr Elixir 100%, all sold — alongside random books, better ones rarer and pricier (💰500 up to 💰11k) — at Pika's **🥊 Fighter's Corner** tab, restocked on the 3h store slot.

## 🏜️ Dune's Daily Tasks

Dune hands out 5 tasks a day, one drawn from each of 5 hidden difficulty pools (1 = easiest, 5 = hardest — invisible to the player, just enough to guarantee a spread instead of an unlucky all-hard day; source: `src/ui/tasks/taskPool.js`, named after the concept like `fightclub.js`/`kitchen.js`, not the cat). Tasks cover every hands-on activity except the hospital, renaming, and Magic Station/extension unlocks: spend coins shopping, feed/clean a number of times (sometimes a specific item), finish homework/class/job sessions, complete a tour (any, sports-only, or city-only), trade with Pika, deliver a Noonie's Kitchen order, or win a Darcy's Fight Club match — always a count of something you do, never a specific city/team/recipe, so nothing can be already-impossible or already-satisfied by luck. The page is a list (like Achievements): a task marks itself done automatically the moment its count is reached, but a 🎁 Claim button is what actually pays the reward — coins scaled to difficulty (70 → 650), with a bonus item or a free mystery train ticket at the higher tiers — and a claimed row greys out and strikes through. A 6th, implicit row ("clear all 5 tasks above") appears once the other 5 are done, worth its own standalone 💰1000 + ticket bonus and, on being marked done (whether or not it's claimed yet), extends the **streak**. The header shows the current streak and the lifetime total of tasks (0-6/day, all-time) marked done. The board resets at local midnight; missing a day (not clearing all 5) resets the streak to 0. A 100-day streak unlocks Dune as a claimable Desert Cat form in the Magic Station (see the special-form dev guide below — condition id `duneStreak`).

## 💖 Pet Center

Four tabs:

- **📋 Registry** — name + call-me changes, 💰50 fee (breed is preset by species).
- **🏦 Bank** — savings 5.0% APR, loans 15.0% APR (limit 💰50k), daily compounding; panels show pocket cash only.
- **🧑‍🍼 Caretakers** — six automated 4-game-hour services hired via the 🛎️ basket: Pet Sitter 💰300 (auto-feeds from inventory, buys at plain cost), Home Teacher 💰500 (advances the most-behind subject), Job Manager 💰500 (best-paying unlocked job in the top career), Tour Guide 🚩 💰800 (city tours, tickets first), Sports Agent 🎽 💰1000 (sports tours), Super AI Butler 🤖 💰1200 (sitter care + class→job→city tour→class→job→sports tour rotation). Behavior is data-driven from the catalog; End Service refunds prorated; caretakers outrank manual End Activity.
- **🔮 Magic Station** — three sections of pet forms; forms are owned and switching between owned forms is always free and instant:
  - **🐾 Classic Companions** — the purchasable species (all 💰8000; purchase switches you immediately, with a confirmation page).
  - **🌟 Legendary Cats** — Pika, Darcy, Noonie, and Dune as EARNED forms, never sold: **Garden Cat** (Pika — visit every city and sports team), **Tuxedo Cat** (Darcy — master all 50 fight skills), **Calico Cat** (Noonie — learn every recipe), **Desert Cat** (Dune — reach a 100-day Daily Tasks streak). Locked cards show the quest with live progress; once earned, one click claims the form free. Cards show breeds only, like every other form. Each has its own spritesheet (`pets/garden_cat.webp`, `pets/tuxedo_cat.webp`, `pets/calico_cat.webp`; Dune's `pets/desert_cat.webp` doesn't exist yet — it temporarily borrows `pets/white_cat.webp` until real art is added).
  - **🎨 My Own Creations** — "Create My Own Form" first asks for the creation's breed/display name (inline card), then opens a file picker for a spritesheet (`.webp`/`.png`, same 8×11 grid of 192×208 cells); the file is copied into `<data>/pets/` and appears as a locked card under the typed name (file name as fallback), unlocked for 💰8000 like a classic purchase.

  **Adding a special form (developer guide)**: add an entry to `SPECIAL_SPECIES` in `src/ui/items/specialForms.js` — `{key, label, breed, sheet, special: "<condition-id>", defaultName}` — then teach `specialFormProgress()` in the same file how to measure your new `<condition-id>` (return `{have, need}` from the pet-state snapshot), and add a `"magic.cond<ConditionId>"` line (with `{have}`/`{need}` placeholders) to every locale. The Magic Station cards, claim flow, and save validation pick the new form up automatically. To give a special form its real artwork later, just point its `sheet` field at the new file in `src/ui/pets/`.

## 🧩 Extensions

Three tabs: **🧩 My Extensions** (the iPhone-style springboard of installed extension tiles), **🛍️ Marketplace** (official, signed extensions listed from a `registry.json` published to the maintainer's GitHub Releases — `MARKETPLACE_REPO`/`MARKETPLACE_TAG` in `src/extensions/registry.rs`; Install shows a permission card, then downloads and verifies over https), and **🧰 Manager** (📌 pin to the tray/side panel, 🗑️ uninstall, 🔄 reinstall-to-verify when a newer/verified copy exists). The topbar's 📦/🔄 buttons install a local zip and refresh the Marketplace listing. Full user and developer guide, including how to publish, in [extensions.md](extensions.md).

## ⚙️ Settings

Three tabs (a real tab strip, like every other multi-tab view — `SETTINGS_TABS` in `src/ui/hub/constants.js`):

- **⚙️ General** — three cards: **Appearance** (pet size as a % number field, 🌐 Language dropdown), **Behavior** (show-on-all-desktops, launch-at-startup, Hide-my-pet, Pause-on-sleep — each a checkbox), and **🎯 Focus Mode** (see [desktop-pet.md](desktop-pet.md) for what it does). "Quit the app" sits below as a red link.
- **💾 Data** — shows the data folder that holds `save.json`, `extensions/`, and uploaded `pets/`; "Change folder…" validates the target is writable and outside the app, MOVES everything over (copy, then delete the old files), records the new location in a `data-dir.txt` pointer at the default location, and restarts. "Reset all data…" lives here too, as its own danger card — typing the pet's name confirms and restarts into first-run.
- **🧑‍💻 Developer** — a small terminal (`src/ui/hub/settingsDeveloperHTML.js`/`pikaCommands.js`/`terminalOutput.js`): a `$`-prompted input running a fixed `pika <command>` grammar, with history (↑/↓) and scrollback. Real settings — `set-size <n>`, `set-lang <code>`, `show-across-desktops on|off`, `show-on-start on|off`, `hide`/`show`, `pause-on-sleep on|off`, `focus on|off` — call the exact same functions in `settingsActions.js` as their General-tab checkboxes, so the console and the UI never disagree. `fast-mode on|off` (10s care decay, 1 game-minute = 5s) and `freeze on|off` (`devFreeze` — pauses decay/reactions like Focus Mode, but with none of Focus Mode's nav-collapsing UI; purely for testing) are dev-only. A handful of cheat commands (`coin-shower`, `set-coins <n>`, `heal`, `sick on|off`, `achieve-all`) exist for testing too. `help` lists everything live.
