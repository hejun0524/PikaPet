# 💡 Add-on Ideas

A scratchpad of add-on concepts to think about later. Add-ons are separate
ecosystems: they may read the pet's identity (name, species) for flavor, but
their currencies, levels, and items live entirely inside the add-on — nothing
leaks back into the core game economy.

---

## 🗡️ Fantasy Tour (working title: "⟨PetName⟩'s Quest")

### One-liner
The pet steps through a portal into a fantasy world and lives a second life
there: leveling up, buying armour and weapons, fighting monsters for gold,
and apprenticing under trainers to learn skills. Only the pet's **name** (and
maybe species, for the character portrait) crosses the portal — everything
else is a self-contained RPG ecosystem with its own save.

### Why it fits the add-on model
- Completely separate progression (fantasy level ≠ traits, gold ≠ coins), so
  it can't unbalance the core game.
- Turn-based/menu-driven gameplay works great as a self-contained page in the
  add-on iframe — no engine required.
- Ships and updates as a zip: content patches (new monsters, dungeons,
  trainers) without touching the app.

### Core loop
1. **Venture** — pick a zone (Meadow → Dark Forest → Crystal Caves → Dragon
   Peak…, gated by level) and encounter monsters.
2. **Fight** — win → gold + XP + occasional loot; lose → limp home, small
   gold penalty, no permadeath (it's a pet, be kind).
3. **Spend** — town shop: armour (defense), weapons (attack), potions
   (consumables). Equipment has slots (weapon / armour / charm).
4. **Train** — choose a trainer to learn skills; each trainer teaches a
   different school (see below). Skills change what you can do in fights.
5. Repeat with bigger numbers and better art.

### Combat: two candidate mechanics (pick one, or offer both)
- **Word-game battles**: each round deals letter tiles; forming longer or
  rarer words hits harder, monster "weakness letters" give bonus damage,
  skills manipulate tiles (reroll vowels, steal a letter, freeze the
  monster's turn). Smart, replayable, zero art dependency — plays like a
  cross between Scrabble and Pokémon.
- **Classic menu combat**: attack / skill / item / flee with simple stats and
  monster art (emoji-first: 🐺 🕷️ 🧌 🐉, upgradeable to generated sprite art
  later). Lower cognitive load, more idle-friendly.

A hybrid also works: menu combat by default, word-play as the "skill check"
for critical hits.

### Trainers & skill schools
- 🧙 **Wizard** — elemental spells (word-game: vowel manipulation; menu: AoE)
- ⚔️ **Knight** — defense and counters (shields, damage reduction)
- 🏹 **Ranger** — first-strike, flee mastery, treasure-finding
- 🎭 **Bard** — luck, shop discounts, extra gold (charisma school)
- Each trainer costs gold per lesson, has a skill tree of ~5 nodes, and only
  one school can be "active" — respec at a price, so choosing matters.

### Structure (self-contained ecosystem)
- **Fantasy save**: own state (level, XP, gold, inventory, equipment, skills,
  zone progress) persisted in the add-on's localStorage; export/import later.
- **From the pet app**: read-only `pet-info` (name, species) — would need one
  new bridge request; everything else is internal.
- **Art path**: start emoji-only (portable, zero assets), later add generated
  zone backdrops and monster sprites inside the zip (all local files).

### MVP slice (v0.1)
1. One town screen + one zone with 3 monster types.
2. Menu combat, 3 stats (HP/ATK/DEF), level 1-10.
3. Shop with 3 weapons + 3 armours; potions.
4. One trainer with 3 skills.
5. Fantasy save in localStorage; pet name read via a new `pet-info` bridge
   request (nice-to-have; can hardcode "Hero" until then).

### Later ideas
- Daily dungeon (seeded by date, like Pika's shop rotation).
- Word-battle mode as the Wizard school's signature.
- Trophies mirrored as a "Fantasy" tab on the Achievements wall (would need
  an events bridge — only if we ever want cross-over, else keep separate).
- The desktop pet wears a tiny helmet overlay while "in the dungeon" (pure
  cosmetics via a sprite accessory layer — far future).

---

*Add new ideas below this line.*
