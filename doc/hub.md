# 🏘️ The Hub

The hub window ("*{pet}*'s World") holds eleven views, selected from its left panel, the tray popover's World buttons, or the pet's right-click menu. Three of them belong to the app's resident cats: **Pika** 🐱 (female, runs the trading post), **Darcy** 🐈‍⬛ (male, runs the fight club), and **Noonie** 🐈 (female, runs the kitchen).

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

## 💖 Pet Center

Four tabs:

- **📋 Registry** — name + call-me changes, 💰50 fee (breed is preset by species).
- **🏦 Bank** — savings 5.0% APR, loans 15.0% APR (limit 💰50k), daily compounding; panels show pocket cash only.
- **🧑‍🍼 Caretakers** — six automated 4-game-hour services hired via the 🛎️ basket: Pet Sitter 💰300 (auto-feeds from inventory, buys at plain cost), Home Teacher 💰500 (advances the most-behind subject), Job Manager 💰500 (best-paying unlocked job in the top career), Tour Guide 🚩 💰800 (city tours, tickets first), Sports Agent 🎽 💰1000 (sports tours), Super AI Butler 🤖 💰1200 (sitter care + class→job→city tour→class→job→sports tour rotation). Behavior is data-driven from the catalog; End Service refunds prorated; caretakers outrank manual End Activity.
- **🔮 Magic Station** — forms are owned: buy once (Toy Poodle 💰6666, White Cat 💰6767, Bichon Frisé 💰5888; purchase switches you immediately, with a confirmation page), then switch between owned forms anytime for free.

## 🧩 Add-ons

An iPhone-style springboard of installed add-on tiles with a 🧰 manager for installing/uninstalling/pinning zips — full user and developer guide in [addons.md](addons.md).

## ⚙️ Settings

Two boxless sections — **General** (pet size as a % number field, 🌐 Language dropdown, show-on-all-desktops, launch-at-startup, Hide-my-pet checkbox, plus "Quit the app" / "Reset all data…" as red links; reset requires typing the pet's name and restarts into first-run) and **Developer mode** (fast game time — care decays every 10s, 1 game-minute = 5s — and auto-topped-up coins; applies live to newly started activities). Add-ons are managed from the 🧰 manager on the Add-ons homepage.
