// ── Adventure: the pet's second life as a guildmaster ───────────────────────
// A deliberately SEPARATE ecosystem: this page reads only the pet's NAME
// (guild title) and the app's devMode flag (time scale). Finnies 🐟,
// materials, recruits, and all progress live in their own localStorage save
// ("pika-adventure-v1") and never touch coins, traits, or save.json.
// Design doc + to-dos: ADVENTURE.md at the repo root.

const ADV_SAVE_KEY = "pika-adventure-v1";

// The three cats get their own tabs, pushed to the right edge (push: true
// starts the right-aligned group in the hub's #tabs flex row).
const ADV_TABS = [
  { key: "guild", label: "Guild", tabEmoji: "🏰" },
  { key: "world", label: "World", tabEmoji: "🌍" },
  { key: "store", label: "Storehouse", tabEmoji: "📦" },
  { key: "crafts", label: "Crafthouse", tabEmoji: "🛠️" },
  { key: "pika", label: "Pika", tabEmoji: "🐱", push: true },
  { key: "darcy", label: "Darcy", tabEmoji: "🐈‍⬛" },
  { key: "noonie", label: "Noonie", tabEmoji: "🐈" },
];

// UI-only state (not persisted).
let advTab = ADV_TABS[0].key;
let advEra = "ancient";
let advPlace = null; // selected middle-column entry: "city:rome" | "wild:forest"

// ── World data ───────────────────────────────────────────────────────────────
const ADV_ERAS = [
  { key: "ancient", label: "Ancient" },
  { key: "medieval", label: "Medieval" },
  { key: "industrial", label: "Industrial" },
  { key: "information", label: "Information" },
  { key: "modern", label: "Modern" },
];

// Placeholder cities — to be replaced with a real map later (see ADVENTURE.md).
const ADV_CITIES = [
  { key: "rome", label: "Rome", travelExtra: 5 },
  { key: "aachen", label: "Aachen", travelExtra: 8 },
];

// Delivery time = era base + city extra, in minutes. Reaching a deeper past
// takes longer. Fixed numbers for now; may become random later (ADVENTURE.md).
const ADV_ERA_TRAVEL = { ancient: 45, medieval: 35, industrial: 25, information: 15, modern: 10 };

const ADV_MATERIALS = {
  wood: { label: "Wood", value: 4 },
  herbs: { label: "Herbs", value: 5 },
  grain: { label: "Grain", value: 3 },
  wool: { label: "Wool", value: 5 },
  mushroom: { label: "Mushrooms", value: 6 },
  stone: { label: "Stone", value: 4 },
  iron: { label: "Iron", value: 7 },
  crystal: { label: "Crystal", value: 12 },
  glass: { label: "Desert Glass", value: 6 },
  scrap: { label: "Scrap Metal", value: 5 },
  cloth: { label: "Cloth", value: 6 },
  obsidian: { label: "Obsidian", value: 10 },
  sulfur: { label: "Sulfur", value: 8 },
  circuit: { label: "Circuits", value: 14 },
  datashard: { label: "Data Shards", value: 15 },
};

// Wilderness sites: eras null = present in every era. First yield is the
// primary one (recruit level adds a small bonus to it).
const ADV_WILDS = [
  {
    key: "forest", label: "Whispering Forest", eras: null, difficulty: 1, minutes: 20,
    yields: [{ key: "wood", min: 3, max: 6 }, { key: "herbs", min: 1, max: 3 }],
    blurb: "Old pines and older paths. Gentle work for a new recruit.",
  },
  {
    key: "farm", label: "Fallow Farmstead", eras: null, difficulty: 1, minutes: 20,
    yields: [{ key: "grain", min: 3, max: 6 }, { key: "wool", min: 1, max: 3 }],
    blurb: "Nobody tends these fields anymore, but they still give.",
  },
  {
    key: "swamp", label: "Mirebank Swamp", eras: null, difficulty: 2, minutes: 30,
    yields: [{ key: "mushroom", min: 2, max: 4 }, { key: "herbs", min: 2, max: 4 }],
    blurb: "Rich pickings for whoever doesn't mind wet boots and worse.",
  },
  {
    key: "caves", label: "Echoing Caves", eras: null, difficulty: 2, minutes: 35,
    yields: [{ key: "stone", min: 3, max: 5 }, { key: "iron", min: 2, max: 4 }, { key: "crystal", min: 0, max: 1 }],
    blurb: "The deeper galleries hold iron — and, rarely, something that glitters.",
  },
  {
    key: "desert", label: "Glass Desert", eras: null, difficulty: 2, minutes: 30,
    yields: [{ key: "glass", min: 2, max: 5 }, { key: "stone", min: 1, max: 3 }],
    blurb: "Lightning-fused sand, prized by lantern makers. Bring water.",
  },
  {
    key: "village", label: "Abandoned Village", eras: ["medieval", "industrial"], difficulty: 2, minutes: 25,
    yields: [{ key: "scrap", min: 2, max: 4 }, { key: "cloth", min: 2, max: 4 }],
    blurb: "Whoever lived here left in a hurry. Their loss, the guild's gain.",
  },
  {
    key: "volcano", label: "Cinder Volcano", eras: null, difficulty: 3, minutes: 45,
    yields: [{ key: "obsidian", min: 2, max: 4 }, { key: "sulfur", min: 1, max: 3 }],
    blurb: "Obsidian for those quick enough to grab it while it cools.",
  },
  {
    key: "cyber", label: "Cyber Dimension", eras: ["information", "modern"], difficulty: 3, minutes: 40,
    yields: [{ key: "circuit", min: 1, max: 3 }, { key: "datashard", min: 1, max: 2 }],
    blurb: "A place that is technically not a place. Materials are very real, though.",
  },
];

// 10 NPCs. eras/cities null = unrestricted; they roam anywhere in their range
// and move to a new spot every location slot (2h, 2min in dev mode).
const ADV_NPCS = [
  { key: "maximus", name: "Senator Maximus", eras: ["ancient"], cities: ["rome"] },
  { key: "einhard", name: "Einhard the Scribe", eras: ["medieval"], cities: ["aachen"] },
  { key: "livia", name: "Livia the Herbalist", eras: ["ancient", "medieval"], cities: null },
  { key: "alcuin", name: "Brother Alcuin", eras: ["medieval"], cities: null },
  { key: "ada", name: "Ada the Engineer", eras: ["industrial"], cities: null },
  { key: "bell", name: "Officer Bell", eras: ["industrial", "information"], cities: null },
  { key: "iris", name: "Webmaster Iris", eras: ["information"], cities: null },
  { key: "neon", name: "DJ Neon", eras: ["information", "modern"], cities: null },
  { key: "sofia", name: "Curator Sofia", eras: null, cities: ["rome"] },
  { key: "wanderer", name: "The Wanderer", eras: null, cities: null },
];

// Trinkets: task rewards; Pika buys them back at a generous price.
const ADV_TRINKETS = {
  sundial: { label: "Bronze Sundial", price: 30 },
  quill: { label: "Gilded Quill", price: 35 },
  locket: { label: "Silver Locket", price: 40 },
  compass: { label: "Brass Compass", price: 45 },
  musicbox: { label: "Tiny Music Box", price: 55 },
  gearheart: { label: "Gearheart Charm", price: 60 },
  prism: { label: "Signal Prism", price: 70 },
  relic: { label: "Nameless Relic", price: 90 },
};

// Blueprints: sold by Pika, unlocked PERMANENTLY once bought, assembled in
// the Crafthouse from materials. Crafted goods answer high-value NPC requests.
const ADV_BLUEPRINTS = [
  { key: "tonic", label: "Herbal Tonic", price: 40, needs: { herbs: 5, mushroom: 2 } },
  { key: "lantern", label: "Glass Lantern", price: 45, needs: { glass: 4, iron: 2 } },
  { key: "cloak", label: "Woolen Cloak", price: 50, needs: { wool: 6, cloth: 2 } },
  { key: "wagon", label: "Wagon", price: 80, needs: { wood: 8, iron: 4 } },
  { key: "beacon", label: "Signal Beacon", price: 90, needs: { circuit: 3, crystal: 2, iron: 2 } },
];

// The three cats of the adventure. Pika runs the trading post; these two sell
// services (all prices in Finnies):
const ADV_DARCY_LOCATE = 10; // find an NPC (valid until they move on)
const ADV_DARCY_EXPRESS = 15; // Darcy Express: deliver in half the time
const ADV_NOONIE_PER_MIN = 0.5; // instant heal, per remaining minute (min 5)

const ADV_RECRUIT_POOL = [
  { name: "Wren", trade: "fletcher's apprentice" },
  { name: "Bram", trade: "stonemason" },
  { name: "Hazel", trade: "herb-runner" },
  { name: "Otto", trade: "cartwright" },
  { name: "Sable", trade: "night courier" },
  { name: "Finch", trade: "mapmaker" },
  { name: "Marlow", trade: "riverhand" },
  { name: "Juniper", trade: "forager" },
  { name: "Rook", trade: "lampkeeper" },
  { name: "Edda", trade: "loomkeeper" },
  { name: "Cass", trade: "tinkerer" },
  { name: "Piper", trade: "signal-runner" },
];

const ADV_START_TOKENS = 100;
const ADV_MAX_TASKS = 6;
const ADV_HIRE_COST = [0, 60, 120, 190]; // indexed by candidate level

// ── Save / load ──────────────────────────────────────────────────────────────
function advMakeRecruit(name, trade, level) {
  return { name, trade, level, xp: 0, status: "idle", mission: null, injuredUntil: 0 };
}

function advFresh() {
  const first = ADV_RECRUIT_POOL[0];
  return {
    v: 1,
    tokens: ADV_START_TOKENS,
    completed: 0,
    recruits: [advMakeRecruit(first.name, first.trade, 1)],
    materials: {},
    trinkets: {},
    goods: {},
    blueprints: [],
    tasks: [],
    taskSeq: 1,
    located: {}, // npcKey -> {slot, era, city}; stale entries = "last seen"
    met: {}, // npcKey -> notices answered; met NPCs are spotted when browsing
    log: [{ at: Date.now(), text: `The guild opens its doors. ${first.name} signs on as the first recruit.` }],
  };
}

function advLoadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADV_SAVE_KEY));
    if (raw && raw.v === 1) {
      raw.met ??= {}; // saves from before the acquaintance system
      return raw;
    }
  } catch (_) { /* corrupt save falls through to a fresh one */ }
  return advFresh();
}

const adv = advLoadSave();

function advSave() {
  localStorage.setItem(ADV_SAVE_KEY, JSON.stringify(adv));
}

function advLog(text) {
  adv.log.push({ at: Date.now(), text });
  if (adv.log.length > 40) adv.log.splice(0, adv.log.length - 40);
}

// ── Lookups & helpers ────────────────────────────────────────────────────────
const advEraOf = (key) => ADV_ERAS.find((e) => e.key === key);
const advCityOf = (key) => ADV_CITIES.find((c) => c.key === key);
const advWildOf = (key) => ADV_WILDS.find((w) => w.key === key);
const advNpcOf = (key) => ADV_NPCS.find((n) => n.key === key);
const advBpOf = (key) => ADV_BLUEPRINTS.find((b) => b.key === key);

function advGuildLevel() {
  return Math.floor(adv.completed / 5) + 1;
}

// devMode compresses the clock: 1 adventure minute = 1 real second.
function advMs(minutes) {
  return minutes * (appSettings.devMode ? 1000 : 60000);
}

function advRemainText(endsAt) {
  const ms = Math.max(0, endsAt - Date.now());
  if (ms === 0) return "any moment";
  const s = Math.ceil(ms / 1000);
  if (s < 120) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function advCountdown(endsAt) {
  return `<span data-adv-ends="${endsAt}">${advRemainText(endsAt)}</span>`;
}

function advHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// NPCs move to a new spot in their range every location slot.
function advSlot() {
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  return appSettings.devMode
    ? `${day}#${d.getHours()}:${Math.floor(d.getMinutes() / 2)}`
    : `${day}#${Math.floor(d.getHours() / 2)}`;
}

function advNpcSpot(npc) {
  const eras = npc.eras ?? ADV_ERAS.map((e) => e.key);
  const cities = npc.cities ?? ADV_CITIES.map((c) => c.key);
  const combos = [];
  for (const era of eras) for (const city of cities) combos.push({ era, city });
  return combos[advHash(npc.key + advSlot()) % combos.length];
}

// A sighting is only trusted while the NPC hasn't moved on.
function advLocated(npcKey) {
  const loc = adv.located[npcKey];
  return loc && loc.slot === advSlot() ? loc : null;
}

// Spotting an acquaintance while browsing a city counts as a sighting, same
// as paying Darcy — it feeds the ledger on Darcy's tab.
function advRecordSighting(npcKey, spot) {
  const slot = advSlot();
  const cur = adv.located[npcKey];
  if (!cur || cur.slot !== slot || cur.era !== spot.era || cur.city !== spot.city) {
    adv.located[npcKey] = { slot, ...spot };
    advSave();
  }
}

function advTravelMinutes(era, city) {
  return ADV_ERA_TRAVEL[era] + advCityOf(city).travelExtra;
}

function advGoodValue(bpKey) {
  const bp = advBpOf(bpKey);
  return Object.entries(bp.needs).reduce((sum, [k, q]) => sum + ADV_MATERIALS[k].value * q, 0) * 2;
}

function advWantLabel(wants) {
  const label = wants.kind === "good" ? advBpOf(wants.key).label : ADV_MATERIALS[wants.key].label;
  return `${wants.qty} × ${label}`;
}

function advHave(wants) {
  const pool = wants.kind === "good" ? adv.goods : adv.materials;
  return pool[wants.key] ?? 0;
}

function advIdleRecruits() {
  return adv.recruits.filter((r) => r.status === "idle");
}

function advGatherChance(level, difficulty) {
  return Math.min(0.95, Math.max(0.25, 0.6 + 0.08 * level - 0.15 * difficulty));
}

function advXpNeed(level) {
  return 20 + 10 * (level - 1);
}

function advGrantXp(recruit, xp) {
  recruit.xp += xp;
  while (recruit.xp >= advXpNeed(recruit.level)) {
    recruit.xp -= advXpNeed(recruit.level);
    recruit.level++;
    advLog(`${recruit.name} reached level ${recruit.level}.`);
  }
}

// Daily hiring pool: deterministic pick of 3 from whoever isn't hired yet.
function advCandidates() {
  const day = new Date().toISOString().slice(0, 10);
  const hired = new Set(adv.recruits.map((r) => r.name));
  return ADV_RECRUIT_POOL.filter((p) => !hired.has(p.name))
    .map((p) => ({ ...p, sort: advHash(p.name + day) }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map((p) => ({ ...p, level: (advHash(p.name) % 3) + 1 }));
}

// ── Simulation: resolve finished missions, expire and repost tasks ───────────
function advNewTask() {
  const npc = ADV_NPCS[Math.floor(Math.random() * ADV_NPCS.length)];
  let wants;
  if (adv.blueprints.length && Math.random() < 0.2) {
    const key = adv.blueprints[Math.floor(Math.random() * adv.blueprints.length)];
    wants = { kind: "good", key, qty: 1 };
  } else {
    const keys = Object.keys(ADV_MATERIALS);
    wants = { kind: "material", key: keys[Math.floor(Math.random() * keys.length)], qty: 3 + Math.floor(Math.random() * 6) };
  }
  const value = wants.kind === "good" ? advGoodValue(wants.key) : ADV_MATERIALS[wants.key].value * wants.qty;
  const trinketKeys = Object.keys(ADV_TRINKETS);
  adv.tasks.push({
    id: `t${adv.taskSeq++}`,
    npc: npc.key,
    wants,
    tokens: Math.round(value * 1.8) + 10,
    trinket: Math.random() < 0.4 ? trinketKeys[Math.floor(Math.random() * trinketKeys.length)] : null,
    expiresAt: Date.now() + advMs(60 + Math.floor(Math.random() * 180)),
    claimedBy: null,
  });
}

function advResolveMission(recruit) {
  const m = recruit.mission;
  recruit.mission = null;
  recruit.status = "idle";

  if (m.type === "gather") {
    const site = advWildOf(m.site);
    if (Math.random() < advGatherChance(recruit.level, site.difficulty)) {
      const got = [];
      site.yields.forEach((y, i) => {
        let qty = y.min + Math.floor(Math.random() * (y.max - y.min + 1));
        if (i === 0) qty += Math.floor(recruit.level / 3);
        if (qty > 0) {
          adv.materials[y.key] = (adv.materials[y.key] ?? 0) + qty;
          got.push(`${qty} ${ADV_MATERIALS[y.key].label.toLowerCase()}`);
        }
      });
      advGrantXp(recruit, 6 + 4 * site.difficulty);
      advLog(`${recruit.name} returned from the ${site.label} with ${got.join(" and ") || "empty hands"}.`);
    } else {
      recruit.status = "injured";
      recruit.injuredUntil = Date.now() + advMs(20 * site.difficulty);
      advGrantXp(recruit, 2);
      advLog(`${recruit.name} was hurt in the ${site.label} and needs rest.`);
    }
    return;
  }

  // Delivery: the dispatch check guarantees on-time arrival, but guard anyway
  // (a devMode flip mid-flight can bend the clock).
  const task = adv.tasks.find((t) => t.id === m.taskId);
  const npcName = advNpcOf(m.npc).name;
  if (task && m.endsAt <= task.expiresAt) {
    adv.tasks = adv.tasks.filter((t) => t !== task);
    adv.tokens += task.tokens;
    adv.completed++;
    adv.met[m.npc] = (adv.met[m.npc] ?? 0) + 1; // an acquaintance now
    if (adv.met[m.npc] === 1) advLog(`${npcName} will remember the guild's help.`);
    let extra = "";
    if (task.trinket) {
      adv.trinkets[task.trinket] = (adv.trinkets[task.trinket] ?? 0) + 1;
      extra = ` and a ${ADV_TRINKETS[task.trinket].label.toLowerCase()}`;
    }
    advGrantXp(recruit, 8);
    advLog(`${recruit.name} delivered ${advWantLabel(m.cargo).toLowerCase()} to ${npcName} — ${task.tokens} tokens${extra} earned.`);
  } else {
    const pool = m.cargo.kind === "good" ? adv.goods : adv.materials;
    pool[m.cargo.key] = (pool[m.cargo.key] ?? 0) + m.cargo.qty;
    if (task) adv.tasks = adv.tasks.filter((t) => t !== task);
    advGrantXp(recruit, 2);
    advLog(`${recruit.name} arrived too late — ${npcName} had moved on. The goods came home.`);
  }
}

function advProcess() {
  const now = Date.now();
  let changed = false;
  for (const r of adv.recruits) {
    if (r.status === "working" && r.mission && now >= r.mission.endsAt) {
      advResolveMission(r);
      changed = true;
    }
    if (r.status === "injured" && now >= r.injuredUntil) {
      r.status = "idle";
      advLog(`${r.name} has recovered and reports for duty.`);
      changed = true;
    }
  }
  const keep = [];
  for (const t of adv.tasks) {
    if (t.claimedBy || t.expiresAt > now) keep.push(t);
    else {
      advLog(`The notice from ${advNpcOf(t.npc).name} expired unanswered.`);
      changed = true;
    }
  }
  adv.tasks = keep;
  while (adv.tasks.length < ADV_MAX_TASKS) {
    advNewTask();
    changed = true;
  }
  if (changed) advSave();
  return changed;
}

// ── Actions (from clicks; caller re-renders) ─────────────────────────────────
function advHire(name) {
  const candidate = advCandidates().find((c) => c.name === name);
  if (!candidate) return;
  const cost = ADV_HIRE_COST[candidate.level];
  if (adv.tokens < cost) return;
  adv.tokens -= cost;
  adv.recruits.push(advMakeRecruit(candidate.name, candidate.trade, candidate.level));
  advLog(`${candidate.name}, ${candidate.trade}, joined the guild for ${cost} tokens.`);
  advSave();
}

function advNoonieCost(recruit) {
  const remainMin = Math.max(0, recruit.injuredUntil - Date.now()) / 60000 / (appSettings.devMode ? 1 / 60 : 1);
  return Math.max(5, Math.ceil(remainMin * ADV_NOONIE_PER_MIN));
}

function advHeal(name) {
  const recruit = adv.recruits.find((r) => r.name === name);
  if (!recruit || recruit.status !== "injured") return;
  const cost = advNoonieCost(recruit);
  if (adv.tokens < cost) return;
  adv.tokens -= cost;
  recruit.status = "idle";
  recruit.injuredUntil = 0;
  advLog(`Noonie patched ${recruit.name} up for ${cost} tokens — good as new.`);
  advSave();
}

function advLocate(npcKey) {
  const npc = advNpcOf(npcKey);
  if (!npc || advLocated(npcKey) || adv.tokens < ADV_DARCY_LOCATE) return;
  adv.tokens -= ADV_DARCY_LOCATE;
  const spot = advNpcSpot(npc);
  adv.located[npcKey] = { slot: advSlot(), ...spot };
  advLog(`Darcy tracked ${npc.name} to ${advCityOf(spot.city).label}, ${advEraOf(spot.era).label} Era.`);
  advSave();
}

function advGather(siteKey, recruitName) {
  const site = advWildOf(siteKey);
  const recruit = adv.recruits.find((r) => r.name === recruitName);
  if (!site || !recruit || recruit.status !== "idle") return;
  recruit.status = "working";
  recruit.mission = { type: "gather", site: site.key, endsAt: Date.now() + advMs(site.minutes) };
  advLog(`${recruit.name} set out for the ${site.label}.`);
  advSave();
}

function advDeliver(taskId, recruitName, express) {
  const task = adv.tasks.find((t) => t.id === taskId);
  const recruit = adv.recruits.find((r) => r.name === recruitName);
  if (!task || task.claimedBy || !recruit || recruit.status !== "idle") return;
  const loc = advLocated(task.npc);
  if (!loc || advHave(task.wants) < task.wants.qty) return;
  if (express && adv.tokens < ADV_DARCY_EXPRESS) return;

  let minutes = advTravelMinutes(loc.era, loc.city);
  if (express) minutes = Math.ceil(minutes / 2);
  const endsAt = Date.now() + advMs(minutes);
  if (endsAt > task.expiresAt) return; // would arrive after the notice expires

  if (express) adv.tokens -= ADV_DARCY_EXPRESS;
  const pool = task.wants.kind === "good" ? adv.goods : adv.materials;
  pool[task.wants.key] -= task.wants.qty;
  task.claimedBy = recruit.name;
  recruit.status = "working";
  recruit.mission = {
    type: "deliver", taskId: task.id, npc: task.npc, era: loc.era, city: loc.city,
    endsAt, cargo: { ...task.wants },
  };
  advLog(
    `${recruit.name} left for ${advCityOf(loc.city).label} (${advEraOf(loc.era).label} Era)` +
      `${express ? " aboard the Darcy Express" : ""} with ${advWantLabel(task.wants).toLowerCase()}.`
  );
  advSave();
}

function advBuyBlueprint(key) {
  const bp = advBpOf(key);
  if (!bp || adv.blueprints.includes(key) || adv.tokens < bp.price) return;
  adv.tokens -= bp.price;
  adv.blueprints.push(key);
  advLog(`Bought the ${bp.label} blueprint from Pika for ${bp.price} tokens.`);
  advSave();
}

function advSellTrinket(key) {
  if (!(adv.trinkets[key] > 0)) return;
  adv.trinkets[key]--;
  if (adv.trinkets[key] === 0) delete adv.trinkets[key];
  adv.tokens += ADV_TRINKETS[key].price;
  advLog(`Pika bought a ${ADV_TRINKETS[key].label.toLowerCase()} for ${ADV_TRINKETS[key].price} tokens.`);
  advSave();
}

function advCraft(key) {
  const bp = advBpOf(key);
  if (!bp || !adv.blueprints.includes(key)) return;
  if (!Object.entries(bp.needs).every(([k, q]) => (adv.materials[k] ?? 0) >= q)) return;
  for (const [k, q] of Object.entries(bp.needs)) adv.materials[k] -= q;
  adv.goods[key] = (adv.goods[key] ?? 0) + 1;
  advLog(`The workshop assembled a ${bp.label.toLowerCase()}.`);
  advSave();
}

// ── Rendering ────────────────────────────────────────────────────────────────
function advTokensHTML() {
  return `${adv.tokens.toLocaleString()} 🐟`;
}

function advRecruitSelectHTML(id) {
  const idle = advIdleRecruits();
  if (!idle.length) return `<span class="adv-note">no idle recruits</span>`;
  return `<select id="${id}" class="adv-select">${idle
    .map((r) => `<option value="${esc(r.name)}">${esc(r.name)} (Lv ${r.level})</option>`)
    .join("")}</select>`;
}

function advRecruitCardHTML(r) {
  let status;
  if (r.status === "injured") {
    const cost = advNoonieCost(r);
    status = `<span class="adv-injured">Injured — mends in ${advCountdown(r.injuredUntil)}</span>
      <button class="adv-btn" data-adv-heal="${esc(r.name)}" ${adv.tokens >= cost ? "" : "disabled"}>
        Noonie's care · ${cost} 🐟</button>`;
  } else if (r.status === "working" && r.mission) {
    const m = r.mission;
    status =
      m.type === "gather"
        ? `Gathering at the ${esc(advWildOf(m.site).label)} — back in ${advCountdown(m.endsAt)}`
        : `Delivering to ${esc(advNpcOf(m.npc).name)} in ${esc(advCityOf(m.city).label)} — arrives in ${advCountdown(m.endsAt)}`;
  } else {
    status = "Awaiting orders in the guild hall.";
  }
  const need = advXpNeed(r.level);
  return `
    <div class="adv-card ${r.status !== "idle" ? "adv-dim" : ""}">
      <div class="adv-card-head"><b class="adv-name">${esc(r.name)}</b><span class="adv-note">${esc(r.trade)}</span></div>
      <div class="adv-note">Level ${r.level} · ${r.xp}/${need} xp</div>
      <div class="adv-xp"><i style="width:${Math.round((r.xp / need) * 100)}%"></i></div>
      <div class="adv-status">${status}</div>
    </div>`;
}

function advTaskCardHTML(task) {
  const npc = advNpcOf(task.npc);
  const loc = advLocated(task.npc);
  const have = advHave(task.wants);
  const enough = have >= task.wants.qty;
  const claimed = !!task.claimedBy;

  let whereabouts;
  if (claimed) {
    whereabouts = `<span class="adv-note">${esc(task.claimedBy)} is on the way.</span>`;
  } else if (loc) {
    whereabouts = `<span class="adv-note">Seen in ${esc(advCityOf(loc.city).label)}, ${esc(advEraOf(loc.era).label)} Era — per Darcy.</span>`;
  } else {
    whereabouts = `<span class="adv-note">Whereabouts unknown.</span>
      <button class="adv-btn" data-adv-locate="${task.npc}" ${adv.tokens >= ADV_DARCY_LOCATE ? "" : "disabled"}>
        Ask Darcy · ${ADV_DARCY_LOCATE} 🐟</button>`;
  }

  let dispatch = "";
  if (!claimed && loc && enough) {
    const minutes = advTravelMinutes(loc.era, loc.city);
    const expressMin = Math.ceil(minutes / 2);
    const now = Date.now();
    const idle = advIdleRecruits().length > 0;
    const plainInTime = now + advMs(minutes) <= task.expiresAt;
    const expressInTime = now + advMs(expressMin) <= task.expiresAt;
    const plainOk = idle && plainInTime;
    const expressOk = idle && expressInTime && adv.tokens >= ADV_DARCY_EXPRESS;
    let timeNote = "";
    if (!expressInTime) timeNote = `<div class="adv-note">Not even the Darcy Express can make it before this notice expires.</div>`;
    else if (!plainInTime) timeNote = `<div class="adv-note">A regular courier would arrive after the notice expires — take the Express.</div>`;
    dispatch = `
      <div class="adv-actions">
        ${advRecruitSelectHTML(`adv-dsel-${task.id}`)}
        <button class="adv-btn" data-adv-deliver="${task.id}" ${plainOk ? "" : "disabled"}>Deliver · ${minutes}m</button>
        <button class="adv-btn" data-adv-deliver="${task.id}" data-express="1" ${expressOk ? "" : "disabled"}>
          Darcy Express · ${expressMin}m · ${ADV_DARCY_EXPRESS} 🐟</button>
      </div>
      ${timeNote}`;
  }

  return `
    <div class="adv-card ${claimed ? "adv-dim" : ""}">
      <div class="adv-card-head"><b class="adv-name">${esc(npc.name)}</b>
        <span class="adv-note">expires in ${advCountdown(task.expiresAt)}</span></div>
      <div>Wants <b>${esc(advWantLabel(task.wants))}</b> <span class="adv-note">(storehouse: ${have})</span></div>
      <div class="adv-note">Pays ${task.tokens} 🐟${task.trinket ? ` and a ${esc(ADV_TRINKETS[task.trinket].label)}` : ""}.</div>
      ${whereabouts}
      ${dispatch}
    </div>`;
}

function advGuildHTML(petName) {
  return `
    <div class="adv-section">Notice board</div>
    <div class="adv-note">Folk across the eras post requests here. Gather what they need in the wilderness (World tab), or deliver from the storehouse — Darcy can find whoever posted the notice. Recruits are hired and tended on Noonie's tab.</div>
    <div class="adv-cards adv-tasks">${adv.tasks.map(advTaskCardHTML).join("")}</div>

    <div class="adv-section">Chronicle of ${esc(petName)}'s guild</div>
    <div class="adv-log">${adv.log
      .slice(-8)
      .reverse()
      .map((l) => `<div class="adv-log-line">${esc(l.text)}</div>`)
      .join("")}</div>`;
}

// ── The three cats' tabs ─────────────────────────────────────────────────────
// Pika: the trading post — blueprints for sale, trinkets bought back.
function advPikaHTML() {
  const trinkets = Object.entries(adv.trinkets).filter(([, q]) => q > 0);
  return `
    <p class="adv-prose">Pika's Trading Post. She stocks blueprints from every era and pays
    handsomely for trinkets — where she resells them is her business.</p>

    <div class="adv-section">Blueprints for sale</div>
    ${ADV_BLUEPRINTS.map((bp) => {
      const owned = adv.blueprints.includes(bp.key);
      const needs = Object.entries(bp.needs)
        .map(([k, q]) => `${q} ${ADV_MATERIALS[k].label.toLowerCase()}`)
        .join(" + ");
      return `<div class="adv-row"><span><b>${esc(bp.label)}</b> blueprint <span class="adv-note">(${esc(needs)})</span></span>
        ${owned ? `<span class="adv-note">unlocked</span>` : `<button class="adv-btn" data-adv-buy-bp="${bp.key}" ${adv.tokens >= bp.price ? "" : "disabled"}>Buy · ${bp.price} 🐟</button>`}</div>`;
    }).join("")}
    <div class="adv-note">A blueprint is a one-time purchase — unlocked for good, workable in the Crafthouse.</div>

    <div class="adv-section">Trinket buy-back</div>
    ${
      trinkets.length
        ? trinkets
            .map(
              ([k, qty]) => `<div class="adv-row"><span><b>${esc(ADV_TRINKETS[k].label)}</b> <span class="adv-note">× ${qty}</span></span>
        <button class="adv-btn" data-adv-sell-trinket="${k}">Sell one · ${ADV_TRINKETS[k].price} 🐟</button></div>`
            )
            .join("")
        : `<div class="adv-note">No trinkets to sell yet — folk on the notice board sometimes pay with them.</div>`
    }`;
}

// Darcy: tracking ledger + the Express. Acquaintances and anyone she has
// located get a row; fresh sightings age into "last seen" when NPCs move on.
function advDarcyHTML() {
  const rows = ADV_NPCS.filter((n) => (adv.met[n.key] ?? 0) > 0 || adv.located[n.key]);
  return `
    <p class="adv-prose">Darcy knows where everyone is — for a price. Once you've answered
    someone's notice you'll spot them yourself when visiting their city; Darcy just saves
    you the walk. His Express also halves any delivery, for ${ADV_DARCY_EXPRESS} 🐟.</p>

    <div class="adv-section">Ledger of whereabouts</div>
    ${
      rows.length
        ? rows
            .map((npc) => {
              const met = adv.met[npc.key] ?? 0;
              const fresh = advLocated(npc.key);
              const stale = !fresh && adv.located[npc.key];
              let where;
              if (fresh)
                where = `<span class="adv-note">currently in ${esc(advCityOf(fresh.city).label)}, ${esc(advEraOf(fresh.era).label)} Era</span>`;
              else if (stale)
                where = `<span class="adv-note">last seen in ${esc(advCityOf(stale.city).label)}, ${esc(advEraOf(stale.era).label)} Era — moved on since</span>`;
              else where = `<span class="adv-note">whereabouts unknown</span>`;
              return `<div class="adv-row"><span><b>${esc(npc.name)}</b>${met ? ` <span class="adv-note">· ${met} notice${met > 1 ? "s" : ""} answered</span>` : ""}</span>
        <span class="adv-actions">${where}${
                fresh ? "" : `<button class="adv-btn" data-adv-locate="${npc.key}" ${adv.tokens >= ADV_DARCY_LOCATE ? "" : "disabled"}>Ask Darcy · ${ADV_DARCY_LOCATE} 🐟</button>`
              }</span></div>`;
            })
            .join("")
        : `<div class="adv-note">The ledger is empty. Answer a notice or pay Darcy to locate whoever posted one, and names will start filling this page.</div>`
    }`;
}

// Noonie: HR & Talent Acquisition — the roster, the infirmary, and hiring.
function advNoonieHTML() {
  const candidates = advCandidates();
  return `
    <p class="adv-prose">Noonie runs the guild's people: hiring, wellbeing, and the infirmary.
    Injured recruits mend on their own in a cot upstairs — or right away, for a fee.</p>

    <div class="adv-section">Roster</div>
    <div class="adv-cards">${adv.recruits.map(advRecruitCardHTML).join("")}</div>

    <div class="adv-section">Seeking work today</div>
    <div class="adv-cards">${
      candidates.length
        ? candidates
            .map(
              (c) => `
      <div class="adv-card">
        <div class="adv-card-head"><b class="adv-name">${esc(c.name)}</b><span class="adv-note">${esc(c.trade)}</span></div>
        <div class="adv-note">Level ${c.level}</div>
        <div class="adv-actions"><button class="adv-btn" data-adv-hire="${esc(c.name)}"
          ${adv.tokens >= ADV_HIRE_COST[c.level] ? "" : "disabled"}>Recruit · ${ADV_HIRE_COST[c.level]} 🐟</button></div>
      </div>`
            )
            .join("")
        : `<div class="adv-note">No one is looking for work today. New faces arrive each morning.</div>`
    }</div>`;
}

function advWildDetailHTML(site) {
  const yields = site.yields
    .map((y) => `${ADV_MATERIALS[y.key].label} (${y.min}–${y.max})`)
    .join(", ");
  const pct = Math.round(advGatherChance(1, site.difficulty) * 100);
  return `
    <div class="adv-detail-title">${esc(site.label)}</div>
    <p class="adv-prose">${esc(site.blurb)}</p>
    <div class="adv-note">Terrain: ${"●".repeat(site.difficulty)}${"○".repeat(3 - site.difficulty)} · about ${site.minutes}m out and back</div>
    <div class="adv-note">Yields: ${esc(yields)}</div>
    <div class="adv-note">A level-1 recruit comes home safe about ${pct}% of the time; seasoned recruits fare better. A failed trip means an injury and bed rest — or a visit from Noonie.</div>
    <div class="adv-actions">
      ${advRecruitSelectHTML("adv-gsel")}
      <button class="adv-btn" data-adv-gather="${site.key}" ${advIdleRecruits().length ? "" : "disabled"}>Send to gather</button>
    </div>`;
}

function advCityDetailHTML(city) {
  const era = advEraOf(advEra);
  const minutes = advTravelMinutes(advEra, city.key);
  // Who is ACTUALLY here right now — visible only if they're an acquaintance
  // (≥1 notice answered: you'd recognize them on the street) or freshly
  // located by Darcy. Strangers stay hidden; Darcy just finds people faster
  // than walking every city of every era yourself.
  const here = [];
  for (const npc of ADV_NPCS) {
    const spot = advNpcSpot(npc);
    if (spot.era !== advEra || spot.city !== city.key) continue;
    const known = (adv.met[npc.key] ?? 0) > 0;
    if (!known && !advLocated(npc.key)) continue;
    if (known) advRecordSighting(npc.key, spot); // browsing updates the ledger
    here.push({ npc, known });
  }
  return `
    <div class="adv-detail-title">${esc(city.label)} — ${esc(era.label)} Era</div>
    <div class="adv-note">A delivery here takes about ${minutes}m; the Darcy Express halves that for ${ADV_DARCY_EXPRESS} 🐟.</div>

    <div class="adv-subhead">Familiar faces about town</div>
    ${
      here.length
        ? here
            .map(
              ({ npc, known }) => `<div class="adv-row"><b>${esc(npc.name)}</b>
      <span class="adv-note">${known ? `an old acquaintance — ${adv.met[npc.key]} notice${adv.met[npc.key] > 1 ? "s" : ""} answered` : "pointed out by Darcy"}</span></div>`
            )
            .join("")
        : `<div class="adv-note">Nobody you recognize. Answer someone's notice once and you'll spot them in the streets from then on — or ask Darcy (his ledger is on his own tab).</div>`
    }`;
}

function advWorldHTML() {
  const wilds = ADV_WILDS.filter((w) => !w.eras || w.eras.includes(advEra));
  const [kind, key] = (advPlace ?? "").split(":");
  const selectedWild = kind === "wild" ? wilds.find((w) => w.key === key) : null;
  const selectedCity = kind === "city" ? advCityOf(key) : null;

  let detail = `<div class="adv-note">Pick a city or wilderness to see who's there and what it offers.</div>`;
  if (selectedWild) detail = advWildDetailHTML(selectedWild);
  else if (selectedCity) detail = advCityDetailHTML(selectedCity);

  return `
    <div class="adv-finder">
      <div class="adv-col adv-col-eras">
        ${ADV_ERAS.map(
          (e) => `<button class="adv-item ${e.key === advEra ? "sel" : ""}" data-adv-era="${e.key}">${e.label}</button>`
        ).join("")}
      </div>
      <div class="adv-col adv-col-places">
        <div class="adv-col-head">Cities</div>
        ${ADV_CITIES.map(
          (c) => `<button class="adv-item ${advPlace === `city:${c.key}` ? "sel" : ""}" data-adv-place="city:${c.key}">${c.label}</button>`
        ).join("")}
        <div class="adv-col-head">Wilderness</div>
        ${wilds
          .map(
            (w) => `<button class="adv-item ${advPlace === `wild:${w.key}` ? "sel" : ""}" data-adv-place="wild:${w.key}">${w.label}</button>`
          )
          .join("")}
      </div>
      <div class="adv-col adv-detail">${detail}</div>
    </div>`;
}

function advStoreHTML() {
  const mats = Object.entries(adv.materials).filter(([, q]) => q > 0);
  const goods = Object.entries(adv.goods).filter(([, q]) => q > 0);
  const trinkets = Object.entries(adv.trinkets).filter(([, q]) => q > 0);
  const chip = (label, qty) => `<span class="adv-chip">${esc(label)} <b>× ${qty}</b></span>`;
  return `
    <div class="adv-section">Materials</div>
    <div class="adv-chips">${
      mats.length
        ? mats.map(([k, q]) => chip(ADV_MATERIALS[k].label, q)).join("")
        : `<span class="adv-note">Empty shelves. Send recruits gathering from the World tab.</span>`
    }</div>

    <div class="adv-section">Crafted goods</div>
    <div class="adv-chips">${
      goods.length
        ? goods.map(([k, q]) => chip(advBpOf(k).label, q)).join("")
        : `<span class="adv-note">Nothing assembled yet — the benches wait in the Crafthouse.</span>`
    }</div>

    <div class="adv-section">Trinkets</div>
    <div class="adv-chips">${
      trinkets.length
        ? trinkets.map(([k, q]) => chip(ADV_TRINKETS[k].label, q)).join("")
        : `<span class="adv-note">No trinkets yet — folk on the notice board sometimes pay with them.</span>`
    }</div>
    ${trinkets.length ? `<div class="adv-note">Pika buys trinkets on her tab, at a generous price.</div>` : ""}`;
}

// Crafthouse: every craft in the world, unlocked ones workable, the rest
// greyed out. A blueprint bought from Pika is unlocked permanently.
function advCraftsHTML() {
  return `
    <p class="adv-prose">The guild's crafthouse. Every craft known to the world hangs on this
    wall; a blueprint bought from Pika unlocks its bench for good.</p>

    <div class="adv-section">Crafts</div>
    <div class="adv-cards">${ADV_BLUEPRINTS.map((bp) => {
      const unlocked = adv.blueprints.includes(bp.key);
      const needsRows = Object.entries(bp.needs)
        .map(([k, q]) => {
          const have = adv.materials[k] ?? 0;
          return `<div class="adv-note">${q} ${esc(ADV_MATERIALS[k].label.toLowerCase())}${
            unlocked ? ` — have ${have}` : ""
          }</div>`;
        })
        .join("");
      if (!unlocked) {
        return `
      <div class="adv-card adv-dim">
        <div class="adv-card-head"><b class="adv-name">${esc(bp.label)}</b><span class="adv-note">not found</span></div>
        ${needsRows}
        <div class="adv-note">Blueprint not found — Pika sells one for ${bp.price} 🐟.</div>
      </div>`;
      }
      const can = Object.entries(bp.needs).every(([k, q]) => (adv.materials[k] ?? 0) >= q);
      const made = adv.goods[bp.key] ?? 0;
      return `
      <div class="adv-card">
        <div class="adv-card-head"><b class="adv-name">${esc(bp.label)}</b><span class="adv-note">unlocked${made ? ` · ${made} in store` : ""}</span></div>
        ${needsRows}
        <div class="adv-actions"><button class="adv-btn" data-adv-craft="${bp.key}" ${can ? "" : "disabled"}>Assemble</button></div>
      </div>`;
    }).join("")}</div>`;
}

function adventurePageHTML(petName) {
  advProcess();
  const pages = {
    world: advWorldHTML,
    store: advStoreHTML,
    crafts: advCraftsHTML,
    pika: advPikaHTML,
    darcy: advDarcyHTML,
    noonie: advNoonieHTML,
  };
  const body = (pages[advTab] ?? (() => advGuildHTML(petName)))();
  return `
    <div class="adv-wrap">
      <div class="adv-top">
        <span class="adv-guild">${esc(petName)}'s Guild</span>
        <span class="adv-top-meta">Guild level ${advGuildLevel()} · ${adv.completed} notices answered · <b>${advTokensHTML()}</b></span>
      </div>
      ${body}
    </div>`;
}

// ── Click handling (delegated from the hub's #grid listener) ─────────────────
function advHandleClick(e) {
  const hit = (sel) => e.target.closest(sel);
  let el;
  if ((el = hit("[data-adv-era]"))) {
    advEra = el.dataset.advEra;
    advPlace = null;
  } else if ((el = hit("[data-adv-place]"))) {
    advPlace = el.dataset.advPlace;
  } else if ((el = hit("[data-adv-hire]"))) {
    advHire(el.dataset.advHire);
  } else if ((el = hit("[data-adv-heal]"))) {
    advHeal(el.dataset.advHeal);
  } else if ((el = hit("[data-adv-locate]"))) {
    advLocate(el.dataset.advLocate);
  } else if ((el = hit("[data-adv-gather]"))) {
    advGather(el.dataset.advGather, document.getElementById("adv-gsel")?.value);
  } else if ((el = hit("[data-adv-deliver]"))) {
    const id = el.dataset.advDeliver;
    advDeliver(id, document.getElementById(`adv-dsel-${id}`)?.value, el.dataset.express === "1");
  } else if ((el = hit("[data-adv-buy-bp]"))) {
    advBuyBlueprint(el.dataset.advBuyBp);
  } else if ((el = hit("[data-adv-sell-trinket]"))) {
    advSellTrinket(el.dataset.advSellTrinket);
  } else if ((el = hit("[data-adv-craft]"))) {
    advCraft(el.dataset.advCraft);
  } else {
    return false;
  }
  return true;
}

// The adventure clock: missions resolve by timestamp, so this only needs to
// run while the hub webview exists (backgroundThrottling is disabled).
// Closed-app time settles correctly on the next advProcess().
setInterval(() => {
  const changed = advProcess();
  if (view !== "adventure") return;
  if (changed) renderGrid();
  else
    document.querySelectorAll("[data-adv-ends]").forEach((el) => {
      el.textContent = advRemainText(Number(el.dataset.advEnds));
    });
}, 1000);
