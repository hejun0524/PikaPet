const { invoke } = window.__TAURI__.core;
const { listen, emit } = window.__TAURI__.event;

// Temporary diagnostics: surface webview errors in the app's stdout.
const jlog = (msg) => invoke("log", { msg: `stats: ${msg}` }).catch(() => {});
window.addEventListener("error", (e) => jlog(`ERROR ${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => jlog(`REJECTION ${e.reason}`));

const nameEl = document.getElementById("pet-name");

// ── Game clock ──────────────────────────────────────────────────────────────
// Developer mode (Settings) speeds everything up; normal is one care point
// every 3 minutes.
const TICK_MS_NORMAL = 60_000 * 3;
const TICK_MS_DEV = 10_000;

function tickMs() {
  return pet.settings.devMode ? TICK_MS_DEV : TICK_MS_NORMAL;
}

// Which care meters decay over time (health has its own rule: each critical
// meter — below CRITICAL_BELOW percent, see panel.js — drains 1 health/tick).
const DECAY_KEYS = ["energy", "hygiene", "mood"];

// ── Pet data ────────────────────────────────────────────────────────────────
// Single source of truth for the pet's data. This window applies all
// mutations (decay tick, item use, purchases, activities), persists to
// save.json, and broadcasts "pet-state" for the other windows.
const pet = {
  name: "Huanhuan",
  species: "toy_poodle", // breed label derives from the species
  forms: ["toy_poodle"], // species the pet owns and can transform into
  callMe: "Owner",
  coins: 1000,
  achievements: [],
  settings: { scale: 0.5, allDesktops: true, devMode: false },
  care: CARE_META.map((m) => ({ ...m, value: 100, max: 100 })),
  traits: TRAIT_META.map((m) => ({ ...m, value: 0 })),
  bag: Object.fromEntries(ALL_ITEMS.map((i) => [i.key, i.startQty ?? DEFAULT_ITEM_QTY])),
  school: {
    subjects: Object.fromEntries(SUBJECTS.map((s) => [s.key, { years: 0, credits: 0 }])),
  },
  career: {
    xp: Object.fromEntries(CAREERS.map((c) => [c.key, 0])),
  },
  // The plan is a queue of {type: "class"|"job"|"tour", key}; active adds timing.
  activity: { plan: [], active: null },
  // Hired caretaker shifts (queue of caretaker keys + the one on duty).
  caretaking: { plan: [], active: null },
  // Last known desktop position of the pet window (restored on launch).
  window: null,
  touring: {
    visited: Object.fromEntries(ALL_PLACES.map((d) => [d.key, []])),
    journals: [],
  },
  souvenirs: {}, // city name -> count
  tickets: {}, // "flight:City" / "train:dest" -> count
  pika: { date: "", wants: [], sells: [] },
  bank: { savings: 0, loan: 0, date: "" },
  homework: { date: "", count: 0 }, // daily homework limit tracking
  pinnedAddons: [], // add-on ids pinned to the popover + hub quick-launch rows
};

// Care meters were renamed once; accept values saved under the old names.
const LEGACY_CARE_KEYS = {
  energy: "fullness",
  hygiene: "freshness",
  mood: "happiness",
};

function traitOf(key) {
  return pet.traits.find((t) => t.key === key);
}

function meterOf(key) {
  return pet.care.find((s) => s.key === key);
}

// ── Persistence (save.json in the app data dir, via Rust commands) ─────────
// On a first run (no save file), nothing is written until the setup window
// finishes — quitting mid-setup keeps the app in the first-run state.
let saveEnabled = true;

function save() {
  if (!saveEnabled) return;
  const a = pet.activity.active;
  const state = {
    name: pet.name,
    species: pet.species,
    forms: pet.forms,
    callMe: pet.callMe,
    coins: pet.coins,
    achievements: pet.achievements,
    settings: pet.settings,
    care: Object.fromEntries(pet.care.map((s) => [s.key, s.value])),
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    bag: pet.bag,
    school: { subjects: pet.school.subjects },
    career: { xp: pet.career.xp },
    touring: pet.touring,
    souvenirs: pet.souvenirs,
    tickets: pet.tickets,
    pika: pet.pika,
    bank: pet.bank,
    homework: pet.homework,
    pinnedAddons: pet.pinnedAddons,
    activity: {
      plan: [...pet.activity.plan],
      // Persist elapsed time, not wall-clock, so a closed app pauses activities.
      active: a
        ? { type: a.type, key: a.key, durationMs: a.durationMs, elapsedMs: Date.now() - a.startedAt }
        : null,
    },
    caretaking: {
      plan: [...pet.caretaking.plan],
      active: pet.caretaking.active
        ? {
            key: pet.caretaking.active.key,
            durationMs: pet.caretaking.active.durationMs,
            elapsedMs: Date.now() - pet.caretaking.active.startedAt,
          }
        : null,
    },
    window: pet.window,
  };
  invoke("save_state", { state: JSON.stringify(state, null, 2) }).catch((e) =>
    console.error("save failed:", e)
  );
}

function degreeCert(subjectKey, stageKey) {
  const stage = SCHOOL_STAGES.find((s) => s.key === stageKey);
  const subject = findSubject(subjectKey);
  return {
    type: "degree",
    subject: subjectKey,
    stage: stageKey,
    emoji: stage.emoji,
    label: `${stage.label} Diploma in ${subject.label}`,
    date: new Date().toISOString().slice(0, 10),
  };
}

function careerCert(careerKey, tierIndex) {
  const career = findCareer(careerKey);
  return {
    type: "career",
    career: careerKey,
    tier: tierIndex,
    emoji: career.emoji,
    label: `${career.label} · ${TIERS[tierIndex].name} Tier Mastered`,
    date: new Date().toISOString().slice(0, 10),
  };
}

function touringCert(placeKey) {
  const place = findPlace(placeKey);
  return {
    type: "touring",
    place: placeKey,
    emoji: place.emoji,
    label: `${place.label} Explorer`,
    date: new Date().toISOString().slice(0, 10),
  };
}

function awardTouringCerts(placeKeys) {
  for (const key of new Set(placeKeys)) {
    const place = findPlace(key);
    if (!place) continue;
    if ((pet.touring.visited[key] ?? []).length < place.cities.length) continue;
    const exists = pet.achievements.some((a) => a.type === "touring" && a.place === key);
    if (!exists) pet.achievements.push(touringCert(key));
  }
}

// Grant any achievement the current progress already implies (also repairs
// saves from before the achievements feature existed).
function backfillAchievements() {
  awardTouringCerts(ALL_PLACES.map((p) => p.key));
  for (const subject of SUBJECTS) {
    const years = pet.school.subjects[subject.key]?.years ?? 0;
    for (const stage of SCHOOL_STAGES) {
      if (years < stageEndYears(stage.key)) continue;
      const exists = pet.achievements.some(
        (a) => a.type === "degree" && a.subject === subject.key && a.stage === stage.key
      );
      if (!exists) pet.achievements.push(degreeCert(subject.key, stage.key));
    }
  }
  for (const career of CAREERS) {
    const done = tiersCompleted(pet.career.xp[career.key] ?? 0);
    for (let tier = 0; tier < done; tier++) {
      const exists = pet.achievements.some(
        (a) => a.type === "career" && a.career === career.key && a.tier === tier
      );
      if (!exists) pet.achievements.push(careerCert(career.key, tier));
    }
  }
}

// Pre-redesign saves tracked one global {stage, year, credits}; convert that
// into per-subject progress.
function migrateLegacySchool(old) {
  let years = 0;
  if (old.stage === "graduated") {
    years = TOTAL_SCHOOL_YEARS;
  } else {
    for (const stage of SCHOOL_STAGES) {
      if (stage.key === old.stage) {
        years += Math.max(0, (old.year ?? 1) - 1);
        break;
      }
      years += stage.years;
    }
  }
  // One school year came from an internal test injection (2026-08-05), not
  // real play; remove it during this one-time migration.
  years = Math.max(0, years - 1);
  for (const subject of SUBJECTS) {
    pet.school.subjects[subject.key] = { years, credits: 0 };
  }
  jlog(`migrated legacy school progress -> ${years} completed years per subject`);
}

async function load() {
  try {
    const raw = await invoke("load_state");
    if (!raw) {
      saveEnabled = false; // first run: wait for the setup window
      return;
    }
    const saved = JSON.parse(raw);
    if (typeof saved.name === "string" && saved.name.trim()) pet.name = saved.name.trim();
    if (SPECIES.some((s) => s.key === saved.species)) pet.species = saved.species;
    if (Array.isArray(saved.forms)) {
      pet.forms = saved.forms.filter((k) => SPECIES.some((s) => s.key === k));
    }
    if (!pet.forms.includes(pet.species)) pet.forms.push(pet.species);
    if (typeof saved.callMe === "string" && saved.callMe.trim()) pet.callMe = saved.callMe.trim();
    if (typeof saved.coins === "number") pet.coins = saved.coins;
    if (Array.isArray(saved.achievements)) pet.achievements = saved.achievements;
    if (saved.settings && typeof saved.settings === "object") {
      pet.settings = { ...pet.settings, ...saved.settings };
    }
    for (const s of pet.care) {
      const v = saved.care?.[s.key] ?? saved.care?.[LEGACY_CARE_KEYS[s.key]];
      if (typeof v === "number") s.value = Math.min(Math.max(v, 0), s.max);
    }
    for (const t of pet.traits) {
      const v = saved.traits?.[t.key];
      if (typeof v === "number") t.value = v;
    }
    for (const key of Object.keys(pet.bag)) {
      const v = saved.bag?.[key];
      if (typeof v === "number") pet.bag[key] = Math.max(0, Math.floor(v));
    }

    if (saved.school && typeof saved.school.stage === "string") {
      migrateLegacySchool(saved.school); // old one-track format
    } else if (saved.school?.subjects) {
      for (const key of Object.keys(pet.school.subjects)) {
        const s = saved.school.subjects[key];
        if (s && typeof s.years === "number" && typeof s.credits === "number") {
          pet.school.subjects[key] = { years: s.years, credits: s.credits };
        }
      }
    }
    backfillAchievements();

    if (saved.career?.xp) {
      for (const key of Object.keys(pet.career.xp)) {
        if (typeof saved.career.xp[key] === "number") pet.career.xp[key] = saved.career.xp[key];
      }
    }

    if (saved.touring) {
      for (const dest of ALL_PLACES) {
        const v = saved.touring.visited?.[dest.key];
        if (Array.isArray(v)) {
          pet.touring.visited[dest.key] = v.filter((c) => dest.cities.includes(c));
        }
      }
      if (Array.isArray(saved.touring.journals)) pet.touring.journals = saved.touring.journals;
    }
    if (saved.souvenirs && typeof saved.souvenirs === "object") {
      for (const [city, count] of Object.entries(saved.souvenirs)) {
        if (ALL_CITIES.includes(city) && typeof count === "number") {
          pet.souvenirs[city] = Math.max(0, Math.floor(count));
        }
      }
    }
    if (saved.tickets && typeof saved.tickets === "object") {
      for (const [key, count] of Object.entries(saved.tickets)) {
        if (findTour(key)?.ticket && typeof count === "number") {
          pet.tickets[key] = Math.max(0, Math.floor(count));
        }
      }
    }
    if (saved.pika && typeof saved.pika === "object") {
      // A save from before ticket sales existed forces a one-time re-roll.
      const hasSells = Array.isArray(saved.pika.sells);
      pet.pika = {
        date: hasSells && typeof saved.pika.date === "string" ? saved.pika.date : "",
        wants: Array.isArray(saved.pika.wants)
          ? saved.pika.wants.filter((c) => ALL_CITIES.includes(c))
          : [],
        sells: hasSells
          ? saved.pika.sells
              .filter((o) => findTour(ticketOfferKey(o)) && typeof o.price === "number")
              .map((o, i) => ({ id: `legacy#${i}`, ...o }))
          : [],
      };
    }

    if (saved.activity) {
      if (Array.isArray(saved.activity.plan)) {
        pet.activity.plan = saved.activity.plan.filter((e) => activityDef(e));
      }
      const a = saved.activity.active;
      if (a && activityDef(a) && typeof a.durationMs === "number") {
        pet.activity.active = {
          type: a.type,
          key: a.key,
          durationMs: a.durationMs,
          startedAt: Date.now() - Math.max(0, a.elapsedMs ?? 0),
        };
      }
    }

    if (saved.caretaking) {
      if (Array.isArray(saved.caretaking.plan)) {
        pet.caretaking.plan = saved.caretaking.plan.filter((k) => findCaretaker(k));
      }
      const c = saved.caretaking.active;
      if (c && findCaretaker(c.key) && typeof c.durationMs === "number") {
        pet.caretaking.active = {
          key: c.key,
          durationMs: c.durationMs,
          startedAt: Date.now() - Math.max(0, c.elapsedMs ?? 0),
        };
      }
    }
    if (
      saved.window &&
      typeof saved.window.x === "number" &&
      typeof saved.window.y === "number"
    ) {
      pet.window = { x: saved.window.x, y: saved.window.y };
    }
    if (saved.bank && typeof saved.bank === "object") {
      pet.bank = {
        savings: Math.max(0, Math.floor(saved.bank.savings ?? 0)),
        loan: Math.max(0, Math.floor(saved.bank.loan ?? 0)),
        date: typeof saved.bank.date === "string" ? saved.bank.date : "",
      };
    }
    if (Array.isArray(saved.pinnedAddons)) {
      pet.pinnedAddons = saved.pinnedAddons.filter((id) => typeof id === "string");
    }
    if (saved.homework && typeof saved.homework === "object") {
      pet.homework = {
        date: typeof saved.homework.date === "string" ? saved.homework.date : "",
        count: Math.max(0, Math.floor(saved.homework.count ?? 0)),
      };
    }
  } catch (e) {
    console.error("load failed, starting fresh:", e);
    jlog(`load failed: ${e}`);
  }
}

// ── State broadcast ─────────────────────────────────────────────────────────
function activityView() {
  const a = pet.activity.active;
  const def = a ? activityDef(a) : null;
  return {
    plan: [...pet.activity.plan],
    active: def
      ? {
          type: a.type,
          key: a.key,
          name: def.name,
          emoji: def.emoji,
          durationMs: a.durationMs,
          remainingMs: Math.max(0, a.startedAt + a.durationMs - Date.now()),
        }
      : null,
  };
}

function caretakingView() {
  const c = pet.caretaking.active;
  const def = c ? findCaretaker(c.key) : null;
  return {
    plan: [...pet.caretaking.plan],
    active: def
      ? {
          key: def.key,
          name: def.name,
          emoji: def.emoji,
          durationMs: c.durationMs,
          remainingMs: Math.max(0, c.startedAt + c.durationMs - Date.now()),
        }
      : null,
  };
}

function broadcastState() {
  emit("pet-state", {
    name: pet.name,
    breed: findSpecies(pet.species).breed,
    species: pet.species,
    forms: [...pet.forms],
    callMe: pet.callMe,
    coins: pet.coins,
    achievements: [...pet.achievements],
    care: Object.fromEntries(pet.care.map((s) => [s.key, s.value])),
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    bag: { ...pet.bag },
    school: { subjects: pet.school.subjects },
    career: { xp: { ...pet.career.xp } },
    activity: activityView(),
    caretaking: caretakingView(),
    bank: { ...pet.bank },
    addonsInstalled: installedAddons,
    pinnedAddons: [...pet.pinnedAddons],
    homework: { ...pet.homework },
    settings: { ...pet.settings },
  });
}

// ── Pika's daily want-list ──────────────────────────────────────────────────
// Pika's store refreshes every 3 hours (8 slots per day).
function pikaSlot() {
  const now = new Date();
  return `${now.toISOString().slice(0, 10)}#${Math.floor(now.getHours() / 3)}`;
}

function refreshPika() {
  const slot = pikaSlot();
  if (pet.pika.date === slot) return false;
  // Ticket destinations AND prices are re-rolled every slot.
  const randomLeague = SPORT_LEAGUES[Math.floor(Math.random() * SPORT_LEAGUES.length)];
  const sells = [
    ...pickRandomCities(ALL_CITIES, PIKA_FLIGHT_OFFERS).map((city) => ({
      kind: "flight",
      city,
      price: FLIGHT_PRICE_BASE + Math.floor(Math.random() * (FLIGHT_PRICE_VAR + 1)),
    })),
    ...pickRandomCities(
      DESTINATIONS.map((d) => d.key),
      PIKA_TRAIN_OFFERS
    ).map((dest) => ({
      kind: "train",
      dest,
      price: TRAIN_PRICE_BASE + Math.floor(Math.random() * (TRAIN_PRICE_VAR + 1)),
    })),
    // Sports: tickets to specific teams, plus one random league pass.
    ...pickRandomCities(ALL_TEAMS, PIKA_TEAM_OFFERS).map((city) => ({
      kind: "flight",
      city,
      price: TEAM_TICKET_PRICE_BASE + Math.floor(Math.random() * (TEAM_TICKET_PRICE_VAR + 1)),
    })),
    {
      kind: "train",
      dest: randomLeague.key,
      price: LEAGUE_PASS_PRICE_BASE + Math.floor(Math.random() * (LEAGUE_PASS_PRICE_VAR + 1)),
    },
  ];
  pet.pika = {
    date: slot,
    wants: pickRandomCities(ALL_CITIES, PIKA_WANTS_COUNT),
    sells: sells.map((o, i) => ({ id: `${slot}#${i}`, ...o })),
  };
  return true;
}

// One combined trade: sell souvenirs and buy tickets in a single checkout.
// The net amount may go either way; it only needs to be payable overall.
// ── Bank: daily compound interest + deposit/withdraw/borrow/repay ───────────
function applyBankInterest() {
  const today = new Date().toISOString().slice(0, 10);
  if (!pet.bank.date) {
    pet.bank.date = today;
    return false;
  }
  if (pet.bank.date === today) return false;
  const days = Math.max(
    0,
    Math.round((Date.parse(today) - Date.parse(pet.bank.date)) / 86400000)
  );
  if (days > 0) {
    pet.bank.savings = Math.round(pet.bank.savings * Math.pow(1 + SAVINGS_APR / 365, days));
    pet.bank.loan = Math.round(pet.bank.loan * Math.pow(1 + LOAN_APR / 365, days));
  }
  pet.bank.date = today;
  return days > 0;
}

listen("bank-op", ({ payload }) => {
  const amount = Math.floor(Number(payload.amount));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const bank = pet.bank;
  switch (payload.op) {
    case "deposit":
      if (pet.coins < amount) return;
      pet.coins -= amount;
      bank.savings += amount;
      break;
    case "withdraw":
      if (bank.savings < amount) return;
      bank.savings -= amount;
      pet.coins += amount;
      break;
    case "borrow":
      if (bank.loan + amount > LOAN_LIMIT) return;
      bank.loan += amount;
      pet.coins += amount;
      break;
    case "repay": {
      const pay = Math.min(amount, bank.loan, pet.coins);
      if (pay <= 0) return;
      pet.coins -= pay;
      bank.loan -= pay;
      break;
    }
    default:
      return;
  }
  render();
  save();
  broadcastState();
});

// ── Add-on registry ─────────────────────────────────────────────────────────
// Installed add-ons are folders scanned by Rust; the hub triggers rescans
// after install/uninstall via "addons-changed".
let installedAddons = [];

async function rescanAddons() {
  try {
    installedAddons = await invoke("list_installed_addons");
    jlog(`addons installed: ${installedAddons.map((a) => a.id).join(", ") || "(none)"}`);
  } catch (e) {
    console.error("addon scan failed:", e);
    installedAddons = [];
  }
  // Unpin add-ons that are no longer installed.
  pet.pinnedAddons = pet.pinnedAddons.filter((id) =>
    installedAddons.some((a) => a.id === id)
  );
}

// Pin/unpin an add-on to the quick-launch rows (popover + hub side panel).
listen("addon-pin", ({ payload }) => {
  const id = payload.id;
  if (!installedAddons.some((a) => a.id === id)) return;
  pet.pinnedAddons = pet.pinnedAddons.filter((p) => p !== id);
  if (payload.pinned) pet.pinnedAddons.push(id);
  render();
  save();
  broadcastState();
});

listen("addons-changed", async () => {
  await rescanAddons();
  for (const box of document.querySelectorAll(".widget-box")) {
    if (!installedAddons.some((a) => a.id === box.dataset.addon)) {
      hideWidget(box.dataset.addon);
    }
  }
  render();
  save();
  broadcastState();
});

// ── Add-on tray widgets ─────────────────────────────────────────────────────
// Add-ons with a "widget" page in their manifest can hang a mini rounded box
// below this popover (a mini music player, an adventure status…). Boxes stack
// in the order their add-ons turned them on; the window grows to fit.
// Protocol (see ADDONS.md): the add-on's main page sends widget-set / a
// widget-push state; the widget page answers with widget-ready and sends
// widget-action, which we relay back to the main page via a Tauri event.
const POPOVER_W = 360;
const widgetStates = new Map(); // addon id -> last pushed state

function widgetBox(id) {
  return [...document.querySelectorAll(".widget-box")].find(
    (b) => b.dataset.addon === id
  );
}

// The popover window hugs its content: the panel height changes with the
// compact toggle and status rows, and widget boxes hang below it.
let lastPopoverH = 0;

function resizePopover() {
  let h = 9 + document.getElementById("panel").offsetHeight; // 9 = tray arrow
  for (const box of document.querySelectorAll(".widget-box")) {
    h += box.offsetHeight + 8;
  }
  h = Math.ceil(h) + 2;
  if (Math.abs(h - lastPopoverH) < 2) return;
  lastPopoverH = h;
  const { getCurrentWindow } = window.__TAURI__.window;
  const { LogicalSize } = window.__TAURI__.dpi ?? window.__TAURI__.window;
  getCurrentWindow()
    .setSize(new LogicalSize(POPOVER_W, h))
    .catch((e) => jlog(`popover resize failed: ${e}`));
}

function showWidget(id) {
  const addon = installedAddons.find((a) => a.id === id);
  if (!addon?.widget || !addon.dir || widgetBox(id)) return;
  const box = document.createElement("div");
  box.className = "widget-box";
  box.dataset.addon = id;
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  const height = Math.max(32, Math.min(220, Number(addon.widgetHeight) || 64));
  frame.style.height = `${height}px`;
  frame.src = window.__TAURI__.core.convertFileSrc(`${addon.dir}/${addon.widget}`);
  box.appendChild(frame);
  document.getElementById("widgets").appendChild(box);
  resizePopover();
}

function hideWidget(id) {
  widgetBox(id)?.remove();
  widgetStates.delete(id);
  resizePopover();
}

listen("addon-widget-set", ({ payload }) => {
  payload.on ? showWidget(payload.id) : hideWidget(payload.id);
});

listen("addon-widget-state", ({ payload }) => {
  widgetStates.set(payload.id, payload.state);
  widgetBox(payload.id)
    ?.querySelector("iframe")
    ?.contentWindow?.postMessage({ type: "widget-state", state: payload.state }, "*");
});

// Messages FROM widget iframes: a ready handshake (replay the latest state so
// a freshly loaded widget isn't blank) and button actions for the main page.
window.addEventListener("message", (e) => {
  const frame = [...document.querySelectorAll(".widget-box iframe")].find(
    (f) => f.contentWindow === e.source
  );
  if (!frame) return;
  const id = frame.closest(".widget-box").dataset.addon;
  const { type, payload } = e.data ?? {};
  if (type === "widget-ready") {
    const state = widgetStates.get(id);
    if (state !== undefined) {
      frame.contentWindow.postMessage({ type: "widget-state", state }, "*");
    }
  } else if (type === "widget-action") {
    emit("addon-widget-action", { id, payload });
  }
});

listen("pika-checkout", ({ payload }) => {
  const sold = [
    ...new Set(
      (payload.sold ?? []).filter((c) => pet.pika.wants.includes(c) && pet.souvenirs[c] > 0)
    ),
  ];
  const boughtIds = [...new Set(payload.bought ?? [])];
  const bought = pet.pika.sells.filter((o) => boughtIds.includes(o.id));
  if ((!sold.length && !bought.length) || bought.length !== boughtIds.length) {
    emit("pika-result", { ok: false, reason: "stale" });
    return;
  }
  const gain = sold.length * SOUVENIR_SELL_PRICE;
  const cost = bought.reduce((sum, o) => sum + o.price, 0);
  if (pet.coins + gain - cost < 0) {
    emit("pika-result", { ok: false, reason: "coins" });
    return;
  }

  for (const city of sold) {
    pet.souvenirs[city] -= 1;
    pet.pika.wants = pet.pika.wants.filter((c) => c !== city); // want fulfilled
  }
  for (const offer of bought) {
    const key = ticketOfferKey(offer);
    pet.tickets[key] = (pet.tickets[key] ?? 0) + 1;
  }
  pet.pika.sells = pet.pika.sells.filter((o) => !boughtIds.includes(o.id));
  pet.coins += gain - cost;
  render();
  save();
  broadcastState();
  emit("pika-result", { ok: true });
});

// Home → Tickets: clicking a ticket sends the pet traveling (queues if busy).
listen("use-ticket", ({ payload }) => {
  const def = findTour(payload.key);
  if (!def?.ticket || !(pet.tickets[payload.key] > 0)) return;
  pet.activity.plan.push({ type: "tour", key: payload.key });
  processPlan();
  render();
  save();
  broadcastState();
});


// ── Care decay ──────────────────────────────────────────────────────────────
function tick() {
  // All care meters are maintained while the pet is on a trip.
  if (pet.activity.active?.type === "tour") {
    if (refreshPika()) {
      save();
      broadcastState();
    }
    jlog("tick: skipped (touring)");
    return;
  }
  refreshPika();
  applyBankInterest();
  const criticalCount = pet.care.filter(
    (s) => DECAY_KEYS.includes(s.key) && (s.value / s.max) * 100 < CRITICAL_BELOW
  ).length;

  for (const s of pet.care) {
    if (DECAY_KEYS.includes(s.key)) {
      s.value = Math.max(0, s.value - 1);
    } else if (s.key === "health") {
      s.value = Math.max(0, s.value - criticalCount);
    }
  }
  render();
  save();
  broadcastState();
  jlog(`tick: critical=${criticalCount} health=${meterOf("health").value}`);
}

// ── Item use (requested by the hub's Home view) ─────────────────────────────
function canAfford(item) {
  return Object.entries(item.effects).every(([stat, amount]) => {
    if (amount >= 0) return true;
    const meter = meterOf(stat);
    return !meter || meter.value + amount >= 0;
  });
}

function applyItemEffects(item) {
  for (const [stat, amount] of Object.entries(item.effects)) {
    const meter = meterOf(stat);
    if (meter) {
      meter.value = Math.min(meter.max, Math.max(0, meter.value + amount));
      continue;
    }
    const trait = traitOf(stat);
    if (trait) trait.value += amount;
  }
}

listen("use-item", ({ payload }) => {
  const item = ALL_ITEMS.find((i) => i.key === payload.key);
  if (!item) return;
  if (!(pet.bag[item.key] > 0)) return;
  if (!canAfford(item)) return;

  // Homework is capped per day.
  if (HOMEWORK_ITEM_KEYS.has(item.key)) {
    const today = new Date().toISOString().slice(0, 10);
    if (pet.homework.date !== today) {
      pet.homework = { date: today, count: 0 };
    }
    if (pet.homework.count >= HOMEWORK_DAILY_LIMIT) return;
    pet.homework.count += 1;
  }

  pet.bag[item.key] -= 1;
  applyItemEffects(item);
  render();
  save();
  broadcastState();
});

// ── Purchases: cart checkout (requested by the hub's Life view) ─────────────
listen("buy-cart", ({ payload }) => {
  const entries = (payload.items ?? []).map(({ key, qty }) => ({
    entry: findSellable(key),
    qty: Math.max(1, Math.floor(qty ?? 1)),
  }));
  if (!entries.length || entries.some((e) => !e.entry || typeof e.entry.price !== "number")) {
    emit("cart-result", { ok: false, reason: "bad-cart" });
    return;
  }
  const total = entries.reduce((sum, e) => sum + e.entry.price * e.qty, 0);
  if (pet.coins < total) {
    emit("cart-result", { ok: false, reason: "coins" });
    return;
  }

  pet.coins -= total;
  for (const { entry, qty } of entries) {
    if (entry.service) {
      if (entry.key === "cure") {
        for (const s of pet.care) s.value = s.max;
      }
    } else {
      pet.bag[entry.key] = (pet.bag[entry.key] ?? 0) + qty;
    }
  }
  render();
  save();
  broadcastState();
  emit("cart-result", { ok: true });
});

// ── Activities: classes + jobs share one plan queue and clock ───────────────
// Classes: coins + drain up front; credits + trait rewards on completion.
// Jobs: drain up front; coins (pay) + career XP on completion.
// Ending early prorates rewards/pay and refunds the unused share.
function activityDef(entry) {
  if (!entry) return null;
  if (entry.type === "job") return findJob(entry.key);
  if (entry.type === "tour") return findTour(entry.key);
  return findClass(entry.key);
}

function isEntryUnlocked(entry) {
  const def = activityDef(entry);
  if (!def) return false;
  if (entry.type === "job") {
    return isJobUnlocked(def, {
      xp: pet.career.xp,
      traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
      subjects: pet.school.subjects,
    });
  }
  if (entry.type === "tour") return true;
  return isClassUnlocked(def, pet.school.subjects);
}

function canPayDrain(drain) {
  return Object.entries(drain).every(([stat, amount]) => {
    const meter = meterOf(stat);
    return meter && meter.value >= amount;
  });
}

function processPlan() {
  if (pet.activity.active || pet.activity.plan.length === 0) return;
  // A sick pet stays home: no school, no work, no traveling.
  if (meterOf("health").value < SICK_BELOW) {
    pet.activity.plan = [];
    return;
  }
  const entry = pet.activity.plan[0];
  const def = activityDef(entry);
  const cost = entry.type === "job" ? 0 : def?.cost ?? 0;
  if (!def || pet.coins < cost || !canPayDrain(def.drain) || !isEntryUnlocked(entry)) {
    // Can't start the next activity: the rest of the plan is cancelled.
    pet.activity.plan = [];
    return;
  }
  // Ticket trips consume the ticket at departure instead of coins.
  if (def.ticket && !(pet.tickets[entry.key] > 0)) {
    pet.activity.plan = [];
    return;
  }
  pet.activity.plan.shift();
  if (def.ticket) pet.tickets[entry.key] -= 1;
  else pet.coins -= cost;
  for (const [stat, amount] of Object.entries(def.drain)) {
    const meter = meterOf(stat);
    meter.value = Math.max(0, meter.value - amount);
  }
  pet.activity.active = {
    type: entry.type,
    key: entry.key,
    durationMs: def.minutes * schoolMinuteMs(pet.settings.devMode),
    startedAt: Date.now(),
  };
}

// Cities visited = full 30-game-minute blocks elapsed, capped by the package.
function tourVisitCount(def, fraction) {
  return Math.min(def.cityCount, Math.floor((fraction * def.minutes) / TOUR_MINUTES_PER_CITY));
}

function awardActivity(active, def, fraction) {
  if (active.type === "tour") {
    const count = tourVisitCount(def, fraction);
    if (count > 0) {
      // Mystery packages (destKey null) draw from every city in the world;
      // mystery sports tours draw from every team of every league.
      const pool = def.destKey
        ? findPlace(def.destKey).cities
        : def.kind === "sport"
          ? ALL_TEAMS
          : ALL_CITIES;
      const cities = def.kind === "flight" ? [def.city] : pickRandomCities(pool, count);
      const touched = [];
      for (const city of cities) {
        const destKey = cityDestination(city).key;
        touched.push(destKey);
        if (!pet.touring.visited[destKey].includes(city)) {
          pet.touring.visited[destKey].push(city);
        }
        pet.souvenirs[city] = (pet.souvenirs[city] ?? 0) + 1;
      }
      awardTouringCerts(touched);
      // A paid trip fully recharges the pet: back home rested and happy.
      for (const meter of pet.care) meter.value = meter.max;
      const now = new Date();
      pet.touring.journals.unshift({
        date: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
        destination: def.destKey ?? (def.kind === "sport" ? "sports" : "world"),
        cities,
      });
    }
    return;
  }
  if (active.type === "job") {
    pet.coins += Math.round(def.pay * fraction);
    const oldXp = pet.career.xp[def.career] ?? 0;
    const newXp = Math.min(CAREER_MAX_XP, oldXp + Math.floor(def.xp * fraction));
    pet.career.xp[def.career] = newXp;
    // Completing a tier (level 5 cap) earns an achievement.
    for (let tier = tiersCompleted(oldXp); tier < tiersCompleted(newXp); tier++) {
      pet.achievements.push(careerCert(def.career, tier));
    }
    return;
  }
  const subject = pet.school.subjects[def.subject];
  subject.credits += Math.floor(def.credits * fraction);
  for (const [stat, amount] of Object.entries(def.rewards)) {
    const trait = traitOf(stat);
    if (trait) trait.value += Math.floor(amount * fraction);
  }
  // Finished stages become framed certificates on the achievements page.
  for (const stageKey of advanceSubject(subject)) {
    pet.achievements.push(degreeCert(def.subject, stageKey));
  }
}

function completeActivity() {
  const active = pet.activity.active;
  const def = activityDef(active);
  pet.activity.active = null;
  if (def) awardActivity(active, def, 1);
  processPlan();
  render();
  save();
  broadcastState();
}

listen("start-plan", ({ payload }) => {
  const entries = (payload.entries ?? []).filter(
    (e) =>
      (e.type === "class" || e.type === "job" || e.type === "tour") &&
      activityDef(e) &&
      isEntryUnlocked(e)
  );
  if (!entries.length) return;
  pet.activity.plan.push(...entries.map((e) => ({ type: e.type, key: e.key })));
  processPlan();
  render();
  save();
  broadcastState();
});

listen("end-activity", () => endCurrentActivity());

function endCurrentActivity() {
  // While a caretaker is on duty, they manage the schedule — no manual ends.
  if (pet.caretaking.active) return;
  const active = pet.activity.active;
  if (!active) return;
  const def = activityDef(active);
  const fraction = Math.min(1, (Date.now() - active.startedAt) / active.durationMs);
  pet.activity.active = null;
  pet.activity.plan = []; // ending early cancels the rest of the plan
  if (def) {
    awardActivity(active, def, fraction);
    // Refund the unused share of the up-front cost and care drain.
    if (active.type === "tour") {
      const visited = tourVisitCount(def, fraction);
      if (def.ticket) {
        // A ticket trip called back before any visit returns the ticket.
        if (visited === 0) pet.tickets[active.key] = (pet.tickets[active.key] ?? 0) + 1;
      } else {
        // Per-stop price differs between city and sports tours.
        pet.coins += (def.cityCount - visited) * (def.cost / def.cityCount);
      }
    } else {
      if (active.type === "class") {
        pet.coins += Math.round(def.cost * (1 - fraction));
      }
      for (const [stat, amount] of Object.entries(def.drain)) {
        const meter = meterOf(stat);
        meter.value = Math.min(meter.max, meter.value + Math.round(amount * (1 - fraction)));
      }
    }
  }
  render();
  save();
  broadcastState();
}

// ── Caretaking: hired shifts run on their own 4-hour clock ──────────────────
function processCaretaking() {
  if (pet.caretaking.active || pet.caretaking.plan.length === 0) return;
  const def = findCaretaker(pet.caretaking.plan[0]);
  if (!def || pet.coins < def.price) {
    pet.caretaking.plan = [];
    return;
  }
  pet.caretaking.plan.shift();
  pet.coins -= def.price;
  pet.caretaking.active = {
    key: def.key,
    durationMs: CARETAKER_MINUTES * schoolMinuteMs(pet.settings.devMode),
    startedAt: Date.now(),
  };
}

listen("hire-caretakers", ({ payload }) => {
  const keys = (payload.keys ?? []).filter((k) => findCaretaker(k));
  if (!keys.length) return;
  pet.caretaking.plan.push(...keys);
  processCaretaking();
  render();
  save();
  broadcastState();
});

function endCaretaking() {
  const active = pet.caretaking.active;
  if (!active) return;
  const def = findCaretaker(active.key);
  const fraction = Math.min(1, (Date.now() - active.startedAt) / active.durationMs);
  pet.caretaking.active = null;
  pet.caretaking.plan = []; // ending the service cancels queued shifts too
  if (def) pet.coins += Math.round(def.price * (1 - fraction));
  render();
  save();
  broadcastState();
}

listen("end-caretaking", () => endCaretaking());

// ── Caretaker automation ────────────────────────────────────────────────────
// The sitter layer keeps meters high with items (inventory first, auto-buys
// at plain cost when out of stock). The schedule layer fills the activity
// slot per specialty. One action per second keeps the pacing natural.
const SITTER_CARE_LINE = 70;

function sitterLayer() {
  const targets = [];
  const health = meterOf("health");
  if (health.value < SICK_BELOW) targets.push({ stat: "health", meter: health });
  for (const key of DECAY_KEYS) {
    const meter = meterOf(key);
    if (meter.value < SITTER_CARE_LINE) targets.push({ stat: key, meter });
  }
  if (!targets.length) return false;
  targets.sort((a, b) => a.meter.value - b.meter.value); // worst first

  const { stat } = targets[0];
  const candidates = ALL_ITEMS.filter(
    (i) => (i.effects[stat] ?? 0) > 0 && typeof i.price === "number" && canAfford(i)
  );
  const owned = candidates
    .filter((i) => pet.bag[i.key] > 0)
    .sort((a, b) => a.price - b.price);
  if (owned.length) {
    pet.bag[owned[0].key] -= 1;
    applyItemEffects(owned[0]);
    return true;
  }
  const buyable = candidates
    .filter((i) => pet.coins >= i.price)
    .sort((a, b) => a.price - b.price);
  if (buyable.length) {
    pet.coins -= buyable[0].price; // bought at plain cost, no service fee
    applyItemEffects(buyable[0]);
    return true;
  }
  return false;
}

function teacherAction() {
  // Balanced education: advance the subject that is furthest behind.
  let best = null;
  for (const subject of SUBJECTS) {
    const sub = pet.school.subjects[subject.key];
    const info = stageOfYears(sub.years);
    if (!info) continue; // mastered
    if (
      !best ||
      sub.years < best.sub.years ||
      (sub.years === best.sub.years && sub.credits < best.sub.credits)
    ) {
      best = { subject, sub, info };
    }
  }
  if (!best) return false;
  const cls = findClass(`${best.subject.key}-${best.info.stage.key}`);
  if (!cls || pet.coins < cls.cost || !canPayDrain(cls.drain)) return false;
  pet.activity.plan.push({ type: "class", key: cls.key });
  processPlan();
  return !!pet.activity.active;
}

function managerAction() {
  // Deepen the strongest career with its best-paying affordable job.
  const ctx = {
    xp: pet.career.xp,
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    subjects: pet.school.subjects,
  };
  const careers = [...CAREERS].sort(
    (a, b) => (pet.career.xp[b.key] ?? 0) - (pet.career.xp[a.key] ?? 0)
  );
  for (const career of careers) {
    const jobs = JOB_CATALOG.filter(
      (j) => j.career === career.key && isJobUnlocked(j, ctx) && canPayDrain(j.drain)
    ).sort((a, b) => b.pay - a.pay);
    if (jobs.length) {
      pet.activity.plan.push({ type: "job", key: jobs[0].key });
      processPlan();
      return !!pet.activity.active;
    }
  }
  return false;
}

// Spend an owned ticket of the right kind (city vs sports), if any.
function useTicketAction(wantLeague) {
  for (const [key, count] of Object.entries(pet.tickets)) {
    if (!(count > 0)) continue;
    const def = findTour(key);
    if (!def || isLeagueKey(def.destKey) !== wantLeague) continue;
    pet.activity.plan.push({ type: "tour", key });
    processPlan();
    return !!pet.activity.active;
  }
  return false;
}

function guideAction() {
  if (useTicketAction(false)) return true;
  const def = findTour("tour-any-1");
  if (pet.coins < def.cost) return false;
  pet.activity.plan.push({ type: "tour", key: def.key });
  processPlan();
  return !!pet.activity.active;
}

function agentAction() {
  if (useTicketAction(true)) return true;
  const def = findTour("sport-any-1");
  if (pet.coins < def.cost) return false;
  pet.activity.plan.push({ type: "tour", key: def.key });
  processPlan();
  return !!pet.activity.active;
}

// Caretaker behavior is data-driven from the CARETAKERS catalog: `care`
// enables the item layer, `schedule` is a rotation of activity kinds.
const SCHEDULE_ACTIONS = {
  class: teacherAction,
  job: managerAction,
  citytour: guideAction,
  sporttour: agentAction,
};
let scheduleStep = 0;

function caretakerBrain() {
  const active = pet.caretaking.active;
  if (!active) return false;
  const def = findCaretaker(active.key);
  if (!def) return false;
  // Care first, then fill an empty activity slot from the rotation.
  if (def.care && sitterLayer()) return true;
  if (def.schedule && !pet.activity.active && pet.activity.plan.length === 0) {
    for (let i = 0; i < def.schedule.length; i++) {
      const kind = def.schedule[(scheduleStep + i) % def.schedule.length];
      const action = SCHEDULE_ACTIONS[kind];
      if (action && action()) {
        scheduleStep = (scheduleStep + i + 1) % def.schedule.length;
        return true;
      }
    }
  }
  return false;
}

// The pet window reports where it was left after each drag.
listen("pet-moved", ({ payload }) => {
  if (typeof payload.x === "number" && typeof payload.y === "number") {
    pet.window = { x: payload.x, y: payload.y };
    save();
  }
});

// Fine-grained master clock: runs the care decay tick at the current speed
// (developer mode toggles live), completes activities/shifts and streams
// countdowns.
let lastDecayAt = Date.now();
setInterval(() => {
  if (Date.now() - lastDecayAt >= tickMs()) {
    lastDecayAt = Date.now();
    tick();
    return;
  }
  const a = pet.activity.active;
  const c = pet.caretaking.active;
  if (!a && !c) return;
  if (a && Date.now() - a.startedAt >= a.durationMs) {
    completeActivity();
    return;
  }
  if (c && Date.now() - c.startedAt >= c.durationMs) {
    pet.caretaking.active = null;
    processCaretaking();
    render();
    save();
    broadcastState();
    return;
  }
  if (caretakerBrain()) {
    render();
    save();
    broadcastState();
    return;
  }
  broadcastState();
  render();
}, 1000);

// ── Government registry (name / call-me changes, for a fee) ─────────────────
const GOV_FEE = 50;

listen("gov-update", ({ payload }) => {
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 20) : "";
  const callMe = typeof payload.callMe === "string" ? payload.callMe.trim().slice(0, 12) : "";
  const changed = (name && name !== pet.name) || (callMe && callMe !== pet.callMe);
  if (!changed || pet.coins < GOV_FEE) return;

  pet.coins -= GOV_FEE;
  if (name) pet.name = name;
  if (callMe) pet.callMe = callMe;
  render();
  save();
  broadcastState();
});

// First-run setup window finished: initialize the pet and start saving.
listen("setup-complete", ({ payload }) => {
  if (SPECIES.some((s) => s.key === payload.species)) {
    pet.species = payload.species;
    pet.forms = [payload.species];
  }
  if (typeof payload.name === "string" && payload.name.trim()) {
    pet.name = payload.name.trim().slice(0, 20);
  }
  if (typeof payload.callMe === "string" && payload.callMe.trim()) {
    pet.callMe = payload.callMe.trim().slice(0, 12);
  }
  saveEnabled = true;
  render();
  save();
  broadcastState();
});

// Magic Station: buy a form once at its full price (switches immediately);
// switching between owned forms is free.
listen("gov-magic", ({ payload }) => {
  const species = SPECIES.find((s) => s.key === payload.species);
  if (!species || species.key === pet.species) return;
  const owned = pet.forms.includes(species.key);
  const cost = owned ? 0 : species.price;
  if (pet.coins < cost) return;
  pet.coins -= cost;
  if (!owned) pet.forms.push(species.key);
  pet.species = species.key;
  render();
  save();
  broadcastState();
});

// ── Rendering (shared HTML builders live in panel.js) ───────────────────────
function render() {
  nameEl.textContent = pet.name;
  document.getElementById("breed").textContent = findSpecies(pet.species).breed;
  document.getElementById("avatar").style.backgroundImage = `url("${findSpecies(pet.species).sheet}")`;
  const av = activityView();
  const cv = caretakingView();
  let statusHTML = "";
  if (av.active) {
    statusHTML += `<div class="status-row">${activityStatusHTML(av)}
      <button id="stop-activity" title="${av.active.type === "tour" ? "Call back" : "End activity"}" ${cv.active ? "disabled" : ""}>${av.active.type === "tour" ? "📢" : "🛑"}</button></div>`;
  }
  if (cv.active) {
    statusHTML += `<div class="status-row">${caretakingStatusHTML(cv)}
      <button id="stop-caretaking" title="End caretaking service">🛑</button></div>`;
  }
  document.getElementById("study-status").innerHTML = statusHTML;
  document.getElementById("care").innerHTML = trayCompact
    ? miniCareHTML(pet.care)
    : careCardsHTML(pet.care);
  document.getElementById("coins").textContent = `💰 ${pet.coins.toLocaleString()}`;
  document.getElementById("traits").innerHTML = traitCardsHTML(pet.traits);
  const pinned = addonList(installedAddons).filter((a) =>
    pet.pinnedAddons.includes(a.id)
  );
  document.getElementById("addons-section").hidden = pinned.length === 0;
  document.getElementById("addon-row").innerHTML = addonButtonsHTML(pinned);
  resizePopover();
}

// ── Compact (minimized) popover ─────────────────────────────────────────────
// The ▾ toggle collapses the popover to the essentials: slim emoji+bar care
// meters (no numbers) and Home / Add-ons / Settings buttons.
let trayCompact = localStorage.getItem("trayCompact") === "1";

function miniCareHTML(meters) {
  return meters
    .map(
      (m) => `
    <div class="mini-meter" title="${escText(m.label)}: ${m.value}/${m.max}">
      <span class="mm-emoji">${m.emoji}</span>
      <div class="mm-track"><div class="mm-fill${barClassFor(m.value, m.max)}" style="width:${(m.value / m.max) * 100}%"></div></div>
    </div>`
    )
    .join("");
}

function applyTrayCompact() {
  document.body.classList.toggle("compact", trayCompact);
  document.getElementById("tray-collapse").textContent = trayCompact ? "▴" : "▾";
  document.getElementById("tray-collapse").title = trayCompact ? "Expand" : "Minimize";
}

document.getElementById("tray-collapse").addEventListener("click", () => {
  trayCompact = !trayCompact;
  try {
    localStorage.setItem("trayCompact", trayCompact ? "1" : "0");
  } catch {}
  applyTrayCompact();
  render();
});

applyTrayCompact();

// ── Boot ────────────────────────────────────────────────────────────────────
(async () => {
  await load();
  await rescanAddons();
  refreshPika();
  applyBankInterest();
  processPlan(); // resume a queued plan if nothing was active
  processCaretaking();
  render();
  save();
  broadcastState();
  jlog("boot complete, tick timer armed");
})();

// ── Footer buttons + settings persistence ───────────────────────────────────
listen("settings-changed", (event) => {
  pet.settings = { ...pet.settings, ...event.payload };
  save();
});

function openHub(view) {
  emit("hub-view", { view });
  invoke("show_window", { label: "hub" });
}

for (const id of [
  "home",
  "shopping",
  "career",
  "touring",
  "achievements",
  "government",
  "pika",
  "adventure",
  "addons",
  "settings",
]) {
  document.getElementById(id).addEventListener("click", () => openHub(id));
}

// Compact-mode shortcut row.
document.getElementById("mini-home").addEventListener("click", () => openHub("home"));
document.getElementById("mini-addons").addEventListener("click", () => openHub("addons"));
document.getElementById("mini-settings").addEventListener("click", () => openHub("settings"));

// End/call-back the current activity or caretaker straight from the popover.
document.getElementById("study-status").addEventListener("click", (e) => {
  if (e.target.id === "stop-activity") endCurrentActivity();
  else if (e.target.id === "stop-caretaking") endCaretaking();
});

// Add-on buttons open their page in the hub.
document.getElementById("addon-row").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-addon]");
  if (btn) openHub(`addon:${btn.dataset.addon}`);
});

// A popover shouldn't have its own context menu.
window.addEventListener("contextmenu", (e) => e.preventDefault());
