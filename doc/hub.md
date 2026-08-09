# 🏘️ The Hub

The hub window ("*{pet}*'s World") holds eleven views, selected from its left panel, the tray popover's World buttons, or the pet's right-click menu.

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

## ⚔️ Adventure

The pet's second life as a guildmaster — part of the app (not an add-on) but a fully separate, novel-styled ecosystem (serif type; Finnies 🐟 ≠ coins; own localStorage save; reads only the pet's name). Six tabs — Guild (NPC notice board + story chronicle), World (Finder-style three-column browser: 5 eras → cities + wilderness → gathering dispatch and familiar-face sightings), Storehouse (materials/trinkets inventory), Crafthouse (all crafts listed; blueprint purchases unlock benches permanently, the rest greyed out), and the three cats right-aligned: Pika (blueprint shop + trinket buy-back), Darcy (whereabouts ledger, paid locates, the Express), Noonie (HR & Talent Acquisition: roster, hiring pool, instant healing). Answer one notice for an NPC and you'll spot them yourself when browsing their city; Darcy just finds them faster. Full design + to-dos in [adventure.md](adventure.md).

## 🥊 Arena

大乐斗-style asynchronous pet fights (code in `src/ui/arena/`). Live today: fight cards derived from the real pet (Fitness → HP/ATK, Smarts → ATK/DEF, Charm → SPD/Luck, scaled ±15% by care "Condition"), rerollable sparring rivals, and serverless **fight codes** (base64 card snapshots pasted over any chat app — the friend never needs to be online). Pending: the battle engine (`arena/simulateBattle.js` stub documents the constraints — turn-based, seeded, deterministic so both sides replay identical fights), sprite-animated replays, rewards, and an optional free-tier friend directory.

## 🏆 Achievements

Four tabs (Degrees 49, Career Tiers 60, World Touring 27, Sports Touring 5) listing everything earnable; earned rows show their date; backfilled from progress on load.

## 🐱 Pika

"Sell to Pika" / "Buy from Pika" tabs with a 🤝 trade basket — mix souvenir sales (💰200 each) and ticket purchases (city flights, country trains, team tickets, league passes at randomized prices) into one atomic checkout whose net can be in your favor. Store refreshes every 3 hours.

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
