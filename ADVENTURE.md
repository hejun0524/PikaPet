# ⚔️ Adventure — Design & Status

The Adventure is the pet's second life: a guild-management world spanning five
eras of history, played from the hub's Adventure view. It is written like a
novel — text first, very few emoji.

**It is deliberately its own ecosystem.** The page reads exactly one thing
from the pet app: the pet's **name** (for the guild title) — plus the global
`devMode` flag so the whole world can run on a fast clock during development.
Nothing flows back: Finnies are not coins, recruit levels are not traits,
and the save is separate.

| | |
|---|---|
| Code | `frontend/adventure.js` (all data + logic + rendering), styles in `hub.css` under `.adv-*` |
| Save | `localStorage["pika-adventure-v1"]` — independent of `save.json` |
| Hub hooks | tab source, one `renderGrid` branch, one click-delegation branch, `<script>` tag in `hub.html` |
| Currency | **Finnies 🐟** (fish — what else would three cats trade in? Distinct from 💰 and any real currency) |
| Type | Serif (Georgia) across the whole page — set once on `.adv-wrap`; buttons/selects inherit it |
| Clock | Everything is timestamp-based (`endsAt` / `expiresAt` / `injuredUntil`), resolved lazily by a 1 s tick — missions settle correctly even across app restarts. Dev mode: 1 minute → 1 second. |

---

## The seven tabs

Guild / World / Storehouse / Crafthouse on the left; the three cats — Pika,
Darcy, Noonie — as their own tabs, **right-aligned** (`push: true` on the first of
the group → `margin-left: auto` in the hub's flex tab bar).

### 🏰 Guild
The notice board and the guild chronicle.

- **Notice board** — up to 6 open tasks (see *Tasks* below).
- **Chronicle** — the last 8 events written as story lines ("Wren returned
  from the Whispering Forest with 4 wood."). The full log keeps 40 entries.

### 🌍 World
A macOS-Finder-style **three-column browser**:

1. **Eras** — Ancient, Medieval, Industrial, Information, Modern.
2. **Places in that era** — *Cities* (Rome, Aachen — placeholders, to be
   replaced) and *Wilderness* sites available in that era.
3. **Detail** —
   - *Wilderness*: description, difficulty (●●○), trip duration, yields,
     risk note, and a recruit picker to **send someone gathering**.
   - *City*: travel time to it and **familiar faces about town** — NPCs who
     are actually there right now *and* whom you can see (visibility rules
     below). Strangers are hidden; there is no roster of who "might" be here.

Wilderness sites (first yield is primary; recruit level adds a small bonus):

| Site | Eras | Difficulty | Minutes | Yields |
|---|---|---|---|---|
| Whispering Forest | all | 1 | 20 | wood, herbs |
| Fallow Farmstead | all | 1 | 20 | grain, wool |
| Mirebank Swamp | all | 2 | 30 | mushrooms, herbs |
| Echoing Caves | all | 2 | 35 | stone, iron, crystal (rare) |
| Glass Desert | all | 2 | 30 | desert glass, stone |
| Abandoned Village | Medieval, Industrial | 2 | 25 | scrap, cloth |
| Cinder Volcano | all | 3 | 45 | obsidian, sulfur |
| Cyber Dimension | Information, Modern | 3 | 40 | circuits, data shards |

Gathering success chance: `clamp(0.60 + 0.08·level − 0.15·difficulty, 0.25,
0.95)`. Success → materials + xp (`6 + 4·difficulty`); failure → **injured**
for `20·difficulty` minutes (2 xp consolation).

### 📦 Storehouse
Materials, crafted goods, and trinkets, all as quantity chips. Pure
inventory — assembly happens in the Crafthouse.

### 🛠️ Crafthouse
Every craft in the world on one wall. **Unlocked** benches (blueprint bought
from Pika — a one-time purchase, permanent) show the recipe with have-counts
and an *Assemble* button; **not-found** crafts are greyed out with a pointer
to Pika's price.

### 🐱 Pika — the Trading Post
Sells **blueprints** (one-time purchases — unlocked permanently, workable in the Crafthouse); buys **trinkets** back at a generous price (30–90 🐟).

### 🐈‍⬛ Darcy — tracking & the Express
Darcy is the guild's tracker (he/him; Pika and Noonie are she/her). The **ledger of whereabouts**: one row per NPC you know of (acquaintances
plus anyone ever located), showing *currently in…* (fresh sighting),
*last seen in… — moved on since* (stale), or *whereabouts unknown*, each with
an *Ask Darcy* button (10 🐟). His **Express** halves delivery travel
(15 🐟).

### 🐈 Noonie — HR & Talent Acquisition
Runs the guild's people: the **roster** (each recruit's trade, level, xp
`need = 20 + 10·(level−1)`, status `idle`/`working`/`injured`, and the
infirmary heal button) and the **hiring pool** — 3 candidates per day, picked
deterministically from a pool of 12 names minus anyone hired, costing
60 / 120 / 190 🐟 by level. You start with 1 free recruit (Wren) and 100 🐟.

---

## NPC visibility (who you can see, and where)

- Completing **one task for an NPC makes them an acquaintance** (`adv.met`):
  from then on they show up automatically when you browse the city they're
  currently in — you'd recognize them on the street.
- **Browsing counts as a sighting**: spotting an acquaintance in a city
  writes the same ledger entry as paying Darcy, so Darcy's tab stays current
  for free if you do the legwork.
- **Darcy is the shortcut**, not the gatekeeper: 10 🐟 reveals anyone
  instantly (useful for strangers who posted a notice, or to skip walking
  5 eras × N cities). A sighting stays valid until the NPC moves at the next
  location slot; then it decays into "last seen".
- Strangers you've never helped and never located are invisible while
  browsing.

## NPCs & their movement

10 NPCs, each with an era range and/or city range (`null` = unrestricted).
Every **location slot** (2 h; 2 min in dev mode) each NPC hashes to a new
`(era, city)` spot inside their range — players can't see where they are.

| NPC | Eras | Cities |
|---|---|---|
| Senator Maximus | Ancient | Rome |
| Einhard the Scribe | Medieval | Aachen |
| Livia the Herbalist | Ancient, Medieval | any |
| Brother Alcuin | Medieval | any |
| Ada the Engineer | Industrial | any |
| Officer Bell | Industrial, Information | any |
| Webmaster Iris | Information | any |
| DJ Neon | Information, Modern | any |
| Curator Sofia | any | Rome |
| The Wanderer | any | any |

## Tasks (the notice board)

- The board keeps **6 open notices**; expired unclaimed ones come down and
  fresh ones are posted (random NPC, random want, random deadline 1–4 h).
- A notice wants either **materials** (3–8 of one kind) or — 20% of the time,
  and only if you own the blueprint — **a crafted good**.
- Reward: `round(value · 1.8) + 10` 🐟, plus a **trinket** 40% of the time.
- Fulfilling one: have the goods in the storehouse → find the NPC (Darcy) →
  dispatch an idle recruit. Goods leave the storehouse at dispatch; if the
  courier can't arrive before the deadline the dispatch button disables (the
  Express may still make it). Completing a delivery gives the recruit 8 xp
  and counts toward guild level (`level = completed/5 + 1`).

## Healing

Injured recruits mend on their own (`20·difficulty` minutes after a failed
gathering trip); Noonie heals **instantly** for
`max(5, ceil(remaining-minutes · 0.5))` 🐟.

## Travel

Delivery time = **era base + city extra** (deeper past = longer trip):
Ancient 45 m, Medieval 35 m, Industrial 25 m, Information 15 m, Modern 10 m;
Rome +5 m, Aachen +8 m. Fixed numbers for now — see to-dos.

## Blueprints & crafting

| Blueprint | Price | Materials |
|---|---|---|
| Herbal Tonic | 40 🐟 | 5 herbs + 2 mushrooms |
| Glass Lantern | 45 🐟 | 4 glass + 2 iron |
| Woolen Cloak | 50 🐟 | 6 wool + 2 cloth |
| Wagon | 80 🐟 | 8 wood + 4 iron |
| Signal Beacon | 90 🐟 | 3 circuits + 2 crystal + 2 iron |

A crafted good's task value = 2× its material value, so crafted notices pay
roughly double the raw-material trips they took.

---

## To-dos

- [ ] **Replace the placeholder cities** (Rome, Aachen) with the real city
      map — several cities per era, era-specific availability (a city can
      exist in some eras only), and per-city character.
- [ ] **Decide travel times**: keep the fixed era+city table, or make them
      random within a band per trip (currently fixed).
- [ ] Balance pass on the whole economy (start tokens, hire costs, task
      rewards, trinket prices, injury durations) once real play data exists.
- [ ] More NPCs (rotating cast?), with portraits/descriptions and favored
      wants (the herbalist should mostly want herbs).
- [ ] Wilderness assignment *from a task card* ("gather what this notice
      needs") as a shortcut, not just via the World tab.
- [ ] Guild level should matter: perks per level (extra notice slots, cheaper
      Darcy, faster healing…).
- [ ] Darcy Express for **gathering** trips (currently deliveries only).
- [ ] Recruit depth: traits/specialties (a forager gathers better in forests),
      equipment made from crafted goods (the Wagon should *do* something —
      e.g. bigger hauls).
- [ ] Pika stock rotation (daily blueprint selection instead of the full
      catalog everywhere) and rarer, era-specific blueprints.
- [ ] Multi-recruit missions and/or the word-challenge mini-game from the
      original prototype as a critical-success mechanic.
- [ ] Nicer empty/first-run experience: a short prologue page before the
      guild opens.
- [ ] Export/import the adventure save (it lives in localStorage; a reset via
      the app's "Reset all data" does **not** clear it today — decide whether
      it should).
- [ ] Art: small portraits for the three cats and the NPCs (local assets, no
      emoji).
