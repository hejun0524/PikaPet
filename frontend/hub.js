const { invoke, convertFileSrc } = window.__TAURI__.core;
const { emit, listen } = window.__TAURI__.event;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { getCurrentWindow } = window.__TAURI__.window;

// Temporary diagnostics: surface webview errors in the app's stdout.
const jlog = (msg) => invoke("log", { msg: `hub: ${msg}` }).catch(() => {});
window.addEventListener("error", (e) => jlog(`ERROR ${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => jlog(`REJECTION ${e.reason}`));

// Display-only mirror of the pet's state; the stats window owns the truth.
// This window emits "use-item" (Home), "buy-cart" (Shopping), "start-plan" /
// "end-activity" (Career), "gov-update" (Government) and "settings-changed"
// (Settings); updates return via "pet-state".
const state = {
  name: "Huanhuan",
  species: "toy_poodle", // breed label derives from the species
  forms: ["toy_poodle"],

  callMe: "Owner",
  coins: 1000,
  achievements: [],
  care: Object.fromEntries(CARE_META.map((m) => [m.key, 100])),
  traits: Object.fromEntries(TRAIT_META.map((m) => [m.key, 0])),
  bag: Object.fromEntries(ALL_ITEMS.map((i) => [i.key, i.startQty ?? DEFAULT_ITEM_QTY])),
  school: {
    subjects: Object.fromEntries(SUBJECTS.map((s) => [s.key, { years: 0, credits: 0 }])),
  },
  career: {
    xp: Object.fromEntries(CAREERS.map((c) => [c.key, 0])),
  },
  activity: { plan: [], active: null },
  caretaking: { plan: [], active: null },
  touring: {
    visited: Object.fromEntries(ALL_PLACES.map((d) => [d.key, []])),
    journals: [],
  },
  souvenirs: {},
  tickets: {},
  pika: { date: "", wants: [], sells: [] },
  bank: { savings: 0, loan: 0, date: "" },
  addonsInstalled: [],
  pinnedAddons: [],
};

const HOME_TABS = [
  ...ITEM_CATALOG,
  { key: "tickets", label: "Tickets", tabEmoji: "🎫" },
  { key: "souvenirs", label: "Souvenirs", tabEmoji: "🎁" },
];

const ACH_TABS = [
  { key: "degrees", label: "Degrees", tabEmoji: "🎓" },
  { key: "careers", label: "Career Tiers", tabEmoji: "💼" },
  { key: "touring", label: "World Touring", tabEmoji: "🗺️" },
  { key: "sports", label: "Sports Touring", tabEmoji: "🏟️" },
];

const PIKA_TABS = [
  { key: "sell", label: "Sell to Pika", tabEmoji: "🎁" },
  { key: "buy", label: "Buy from Pika", tabEmoji: "🎫" },
];

const PETCENTER_TABS = [
  { key: "registry", label: "Registry", tabEmoji: "📋" },
  { key: "bank", label: "Bank", tabEmoji: "🏦" },
  { key: "caretakers", label: "Caretakers", tabEmoji: "🧑‍🍼" },
  { key: "magic", label: "Magic Station", tabEmoji: "🔮" },
];

const VIEWS = {
  home: { title: "🏠 Home" },
  shopping: { title: "🧺 Life" },
  career: { title: "💼 Career" },
  touring: { title: "🗺️ Touring" },
  achievements: { title: "🏆 Achievements" },
  government: { title: "💖 Pet Center" },
  pika: { title: "🐱 Pika" },
  adventure: { title: "⚔️ Adventure" },
  addons: { title: "🧩 Add-ons" },
  settings: { title: "⚙️ Settings" },
};

let view = "home";
let homeTab = ITEM_CATALOG[0].key;
let shopTab = SHOP_CATALOG[0].key;
let careerTab = CAREER_CATALOG[0].key;
let touringTab = TOURING_TABS[0].key;
let jobCareer = CAREERS[0].key;
let schoolSubject = SUBJECTS[0].key;
let tourDest = DESTINATIONS[0].key;
let sportLeague = SPORT_LEAGUES[0].key;
let achTab = ACH_TABS[0].key;
let pikaTab = PIKA_TABS[0].key;
let petcenterTab = PETCENTER_TABS[0].key;

// Shopping cart, career plan book, and Pika trade cart: purely local until
// checkout / start.
const cart = new Map(); // item key -> qty
let planBook = []; // [{type: "class"|"job", key}]
const tradeSell = new Set(); // souvenir cities staged to sell (one each)
const tradeBuy = new Map(); // offer id -> offer
let serviceCart = []; // caretaker keys staged to hire (duplicates = extra shifts)

// Mirrors save.json's settings; edited here, persisted by the stats window.
const appSettings = { scale: 0.5, allDesktops: true, devMode: false };

function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function unlockCtx() {
  return { xp: state.career.xp, traits: state.traits, subjects: state.school.subjects };
}

function planEntryDef(entry) {
  if (entry.type === "job") return findJob(entry.key);
  if (entry.type === "tour") return findTour(entry.key);
  return findClass(entry.key);
}

function isSick() {
  return state.care.health < SICK_BELOW;
}

function effectsText(item) {
  if (item.desc) return item.desc;
  return Object.entries(item.effects)
    .map(([stat, amount]) => `${amount > 0 ? "+" : "−"}${Math.abs(amount)} ${STAT_EMOJI[stat]}`)
    .join(" ");
}

function drainText(drain) {
  return Object.entries(drain)
    .map(([stat, amount]) => `−${amount} ${STAT_EMOJI[stat]}`)
    .join(" ");
}

function isUsable(item) {
  return Object.entries(item.effects).every(([stat, amount]) => {
    if (amount >= 0 || !(stat in state.care)) return true;
    return state.care[stat] + amount >= 0;
  });
}

// ── Fly animation (shop items → cart, activities → plan book) ───────────────
function flyEmoji(emoji, fromEl, toEl) {
  if (!fromEl || !toEl) return;
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const span = document.createElement("span");
  span.className = "fly";
  span.textContent = emoji;
  span.style.left = `${from.left + from.width / 2 - 15}px`;
  span.style.top = `${from.top + from.height / 2 - 15}px`;
  document.body.appendChild(span);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      span.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`;
      span.style.opacity = "0.15";
    })
  );
  span.addEventListener("transitionend", () => span.remove(), { once: true });
}

// ── Side panel ──────────────────────────────────────────────────────────────
function renderSidePanel() {
  getCurrentWindow().setTitle(`${state.name}'s World`).catch(() => {});
  document.getElementById("side-name").textContent = state.name;
  document.getElementById("side-breed").textContent = findSpecies(state.species).breed;
  document.getElementById("avatar").style.backgroundImage = `url("${findSpecies(state.species).sheet}")`;
  // Status rows with End buttons live here (and in the popover/right-click
  // menu) — not in the content pages.
  const av = state.activity;
  const cv = state.caretaking;
  let statusHTML = "";
  if (av?.active) {
    statusHTML += `<div class="status-row">${activityStatusHTML(av)}
      <button id="side-stop-activity" ${cv?.active ? "disabled" : ""}>${av.active.type === "tour" ? "📢" : "🛑"}</button></div>`;
  }
  if (cv?.active) {
    statusHTML += `<div class="status-row">${caretakingStatusHTML(cv)}
      <button id="side-stop-care">🛑</button></div>`;
  }
  document.getElementById("side-status").innerHTML = statusHTML;
  document.getElementById("side-care").innerHTML = careCardsHTML(
    CARE_META.map((m) => ({ ...m, value: state.care[m.key], max: 100 }))
  );
  document.getElementById("side-coins").textContent = `💰 ${state.coins.toLocaleString()}`;
  document.getElementById("side-traits").innerHTML = traitCardsHTML(
    TRAIT_META.map((m) => ({ ...m, value: state.traits[m.key] }))
  );
  document.querySelectorAll("#side footer button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  const pinned = addonList(state.addonsInstalled).filter((a) =>
    state.pinnedAddons.includes(a.id)
  );
  document.getElementById("side-addons-section").hidden = pinned.length === 0;
  document.getElementById("side-addons").innerHTML = addonButtonsHTML(
    pinned,
    view.startsWith("addon:") ? view.slice(6) : null
  );
}

// ── Top bar: cart + plan book buttons ───────────────────────────────────────
function renderTopbar() {
  const addon = view.startsWith("addon:")
    ? addonList(state.addonsInstalled).find((a) => a.id === view.slice(6))
    : null;
  document.getElementById("view-title").textContent = addon
    ? `${addon.emoji} ${addon.name}`
    : VIEWS[view].title;
  document.getElementById("cart-btn").hidden = view !== "shopping";
  document.getElementById("plan-btn").hidden = view !== "career";
  document.getElementById("trade-btn").hidden = view !== "pika";
  document.getElementById("service-btn").hidden = view !== "government";
  document.getElementById("manager-btn").hidden = view !== "addons";
  document.getElementById("addons-home-btn").hidden = !view.startsWith("addon:");
  renderCartBadge();
  renderPlanBadge();
  renderTradeBadge();
  renderServiceBadge();
}

function renderServiceBadge() {
  const badge = document.getElementById("service-count");
  badge.hidden = serviceCart.length === 0;
  badge.textContent = serviceCart.length;
}

function renderServiceDrawer() {
  const drawer = document.getElementById("service-drawer");
  if (drawer.hidden) return;
  if (!serviceCart.length) {
    drawer.innerHTML = `<div class="cart-empty">No services staged — click caretaker cards to add shifts</div>`;
    return;
  }
  const rows = serviceCart
    .map((key, i) => {
      const def = findCaretaker(key);
      return `
      <div class="cart-row">
        <span>${def.emoji} ${def.name} · 4h shift</span>
        <span>💰${def.price}</span>
        <button class="cart-remove" data-service-remove="${i}">✕</button>
      </div>`;
    })
    .join("");
  const total = serviceCart.reduce((sum, key) => sum + findCaretaker(key).price, 0);
  const affordable = state.coins >= total;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>Total</span><span>💰${total}</span><span></span></div>
    <div class="cart-actions">
      <button id="service-clear">Clear</button>
      <button id="service-hire" ${affordable ? "" : "disabled"}>
        ${affordable ? "🛎️ Hire" : "Not enough coins"}
      </button>
    </div>`;
}

function renderTradeBadge() {
  const count = tradeSell.size + tradeBuy.size;
  const badge = document.getElementById("trade-count");
  badge.hidden = count === 0;
  badge.textContent = count;
}

function renderTradeDrawer() {
  const drawer = document.getElementById("trade-drawer");
  if (drawer.hidden) return;
  if (tradeSell.size === 0 && tradeBuy.size === 0) {
    drawer.innerHTML = `<div class="cart-empty">Trade basket is empty — click souvenirs to sell and tickets to buy</div>`;
    return;
  }
  const sellRows = [...tradeSell]
    .map(
      (city) => `
      <div class="cart-row">
        <span>🎁 ${esc(souvenirName(city))}</span>
        <span class="trade-gain">+💰${SOUVENIR_SELL_PRICE}</span>
        <button class="cart-remove" data-trade-remove-sell="${esc(city)}">✕</button>
      </div>`
    )
    .join("");
  const buyRows = [...tradeBuy.values()]
    .map((offer) => {
      const def = findTour(ticketOfferKey(offer));
      return `
      <div class="cart-row">
        <span>${def.emoji} ${esc(def.name)} Ticket</span>
        <span>−💰${offer.price}</span>
        <button class="cart-remove" data-trade-remove-buy="${esc(offer.id)}">✕</button>
      </div>`;
    })
    .join("");
  const gain = tradeSell.size * SOUVENIR_SELL_PRICE;
  const cost = [...tradeBuy.values()].reduce((sum, o) => sum + o.price, 0);
  const net = gain - cost;
  const payable = state.coins + net >= 0;
  drawer.innerHTML = `
    ${sellRows}${buyRows}
    <div class="cart-row cart-total">
      <span>Net</span>
      <span class="${net >= 0 ? "trade-gain" : ""}">${net >= 0 ? "+" : "−"}💰${Math.abs(net)}</span>
      <span></span>
    </div>
    <div class="cart-actions">
      <button id="trade-clear">Clear</button>
      <button id="trade-checkout" ${payable ? "" : "disabled"}>
        ${payable ? "🤝 Trade" : "Not enough coins"}
      </button>
    </div>`;
}

function cartTotalPrice() {
  let total = 0;
  for (const [key, qty] of cart) total += findSellable(key).price * qty;
  return total;
}

function renderCartBadge() {
  let count = 0;
  for (const qty of cart.values()) count += qty;
  const badge = document.getElementById("cart-count");
  badge.hidden = count === 0;
  badge.textContent = count;
}

function renderPlanBadge() {
  const badge = document.getElementById("plan-count");
  badge.hidden = planBook.length === 0;
  badge.textContent = planBook.length;
}

function renderCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer.hidden) return;
  if (cart.size === 0) {
    drawer.innerHTML = `<div class="cart-empty">Cart is empty</div>`;
    return;
  }
  const rows = [...cart]
    .map(([key, qty]) => {
      const entry = findSellable(key);
      return `
      <div class="cart-row">
        <span>${entry.emoji} ${entry.name} × ${qty}</span>
        <span>💰${entry.price * qty}</span>
        <button class="cart-remove" data-remove="${key}">✕</button>
      </div>`;
    })
    .join("");
  const total = cartTotalPrice();
  const affordable = state.coins >= total;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>Total</span><span>💰${total}</span><span></span></div>
    <div class="cart-actions">
      <button id="cart-clear">Clear</button>
      <button id="cart-checkout" ${affordable ? "" : "disabled"}>
        ${affordable ? "Checkout" : "Not enough coins"}
      </button>
    </div>`;
}

// The plan book drawer mirrors the cart's flow: stage entries, then Start.
function renderPlanDrawer() {
  const drawer = document.getElementById("plan-drawer");
  if (drawer.hidden) return;
  if (planBook.length === 0) {
    drawer.innerHTML = `<div class="cart-empty">Plan book is empty — click classes or jobs to add them</div>`;
    return;
  }
  const rows = planBook
    .map((entry, i) => {
      const def = planEntryDef(entry);
      const money = entry.type === "job" ? `+💰${def.pay}` : `−💰${def.cost}`;
      return `
      <div class="cart-row">
        <span>${def.emoji} ${def.name} · ⏱ ${def.minutes}m</span>
        <span>${money}</span>
        <button class="cart-remove" data-plan-remove="${i}">✕</button>
      </div>`;
    })
    .join("");
  // Up-front costs (classes + tours; jobs pay instead). Charges happen as
  // each activity starts, but don't let users stage more than they can pay.
  const upfront = planBook.reduce((sum, entry) => {
    const def = planEntryDef(entry);
    return sum + (entry.type === "job" ? 0 : def?.cost ?? 0);
  }, 0);
  const affordable = state.coins >= upfront;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>Up-front cost</span><span>💰${upfront}</span><span></span></div>
    <div class="cart-actions">
      <button id="plan-clear">Clear</button>
      <button id="plan-start" ${affordable ? "" : "disabled"}>
        ${affordable ? "▶ Start plan" : "Not enough coins"}
      </button>
    </div>`;
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function tabSource() {
  if (view === "home") return { source: HOME_TABS, active: homeTab };
  if (view === "shopping") return { source: SHOP_CATALOG, active: shopTab };
  if (view === "career") return { source: CAREER_CATALOG, active: careerTab };
  if (view === "touring") return { source: TOURING_TABS, active: touringTab };
  if (view === "achievements") return { source: ACH_TABS, active: achTab };
  if (view === "pika") return { source: PIKA_TABS, active: pikaTab };
  if (view === "government") return { source: PETCENTER_TABS, active: petcenterTab };
  if (view === "adventure") return { source: ADV_TABS, active: advTab };
  return null;
}

function renderTabs() {
  const tabs = tabSource();
  document.getElementById("tabs").innerHTML = tabs
    ? tabs.source
        .map(
          // push: true starts a right-aligned group (adventure's cat tabs)
          (c) => `
    <button data-tab="${c.key}" class="${c.key === tabs.active ? "active" : ""}${c.push ? " tab-push" : ""}">
      ${c.tabEmoji} ${c.label}
    </button>`
        )
        .join("")
    : "";
}

// ── Cards ───────────────────────────────────────────────────────────────────
function homeCardHTML(item, forceDisabled = false) {
  return `
    <div class="item ${!forceDisabled && isUsable(item) ? "" : "disabled"}" data-use="${item.key}">
      <span class="qty">${state.bag[item.key]}</span>
      <span class="icon">${item.emoji}</span>
      <span class="name">${item.name}</span>
      <span class="effects">${effectsText(item)}</span>
    </div>`;
}

function shopCardHTML(entry) {
  return `
    <div class="item" data-add="${entry.key}">
      <span class="qty price">💰${entry.price}</span>
      <span class="icon">${entry.emoji}</span>
      <span class="name">${entry.name}</span>
      <span class="effects">${effectsText(entry)}</span>
    </div>`;
}

function classCardHTML(cls) {
  const subject = findSubject(cls.subject);
  if (!isClassUnlocked(cls, state.school.subjects)) {
    return `
    <div class="item locked">
      <span class="qty lock">🔒</span>
      <span class="icon">${cls.emoji}</span>
      <span class="name">${cls.name}</span>
      <span class="effects">${subject.emoji} ${subject.label}</span>
      <span class="effects">${classUnlockText(cls)}</span>
    </div>`;
  }
  const rewards = Object.entries(cls.rewards)
    .map(([stat, amount]) => `+${amount} ${STAT_EMOJI[stat]}`)
    .join(" ");
  return `
    <div class="item ${isSick() ? "disabled" : ""}" data-plan-class="${cls.key}">
      <span class="qty price">💰${cls.cost}</span>
      <span class="icon">${cls.emoji}</span>
      <span class="name">${cls.name}</span>
      <span class="effects">${subject.emoji} ${subject.label} · ⏱ ${cls.minutes}m</span>
      <span class="effects">+${cls.credits} credits · ${rewards}</span>
      <span class="effects">${drainText(cls.drain)}</span>
    </div>`;
}

function jobCardHTML(job) {
  if (!isJobUnlocked(job, unlockCtx())) {
    return `
    <div class="item locked">
      <span class="qty lock">🔒</span>
      <span class="icon">${job.emoji}</span>
      <span class="name">${job.name}</span>
      <span class="effects">Rank ${job.rank}</span>
      <span class="effects">${jobRequirementText(job)}</span>
    </div>`;
  }
  return `
    <div class="item ${isSick() ? "disabled" : ""}" data-plan-job="${job.key}">
      <span class="qty pay">+💰${job.pay}</span>
      <span class="icon">${job.emoji}</span>
      <span class="name">${job.name}</span>
      <span class="effects">Rank ${job.rank} · ⏱ ${job.minutes}m · ⭐+${job.xp} XP</span>
      <span class="effects">${drainText(job.drain)}</span>
    </div>`;
}

// ── Career page pieces ──────────────────────────────────────────────────────
function activityStatusRowHTML() {
  const a = state.activity?.active;
  const verb = a ? (a.type === "job" ? "💼" : a.type === "tour" ? "🧳" : "📚") : "";
  const current = a
    ? `<span class="plan-active">${verb} ${a.emoji} ${a.name} · ${formatRemaining(a.remainingMs)} left</span>`
    : isSick()
      ? `<span class="plan-active sick">🤒 Health below ${SICK_BELOW} — no school, work, or travel</span>`
      : `<span class="plan-active idle">Free now</span>`;
  const queued = state.activity?.plan?.length
    ? `<span class="queued-label">⏳ Up next:</span>` +
      state.activity.plan
        .map((entry) => `<span class="chip">${planEntryDef(entry)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}

function schoolPageHTML() {
  const chips = SUBJECTS.map(
    (s) => `
    <button class="career-chip ${s.key === schoolSubject ? "active" : ""}" data-subject="${s.key}">
      ${s.emoji} ${s.label}
    </button>`
  ).join("");
  const sub = state.school.subjects[schoolSubject] ?? { years: 0, credits: 0 };
  const info = stageOfYears(sub.years);
  const progress = info
    ? `<div class="xp-line">${subjectStageLabel(sub)}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${Math.min(100, (sub.credits / info.stage.creditsPerYear) * 100)}%"></div></div>
         <span>${sub.credits}/${info.stage.creditsPerYear} credits</span>
       </div>`
    : `<div class="xp-line">🎉 ${findSubject(schoolSubject).label} mastered!</div>`;
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      ${progress}
    </div>`;
  const classes = CLASS_CATALOG.filter((c) => c.subject === schoolSubject)
    .map(classCardHTML)
    .join("");
  return head + classes;
}

function jobPageHTML() {
  const chips = CAREERS.map(
    (c) => `
    <button class="career-chip ${c.key === jobCareer ? "active" : ""}" data-career="${c.key}">
      ${c.emoji} ${c.label}
    </button>`
  ).join("");
  const career = findCareer(jobCareer);
  const prog = careerProgress(state.career.xp[jobCareer] ?? 0);
  const progress = prog.maxed
    ? `<div class="xp-line">🏅 ${career.emoji} ${career.label} · Master 5 — maxed out!</div>`
    : `<div class="xp-line">📶 ${career.emoji} ${career.label} · ${prog.tierName} Lv ${prog.level}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${(prog.intoLevel / prog.perLevel) * 100}%"></div></div>
         <span>${prog.intoLevel}/${prog.perLevel} XP</span>
       </div>`;
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      ${progress}
    </div>`;
  const jobs = JOB_CATALOG.filter((j) => j.career === jobCareer)
    .map(jobCardHTML)
    .join("");
  return head + jobs;
}

// ── Touring pages ───────────────────────────────────────────────────────────
function tourPackageCardHTML(cityCount) {
  const def = findTour(`tour-any-${cityCount}`);
  return `
    <div class="item ${isSick() ? "disabled" : ""}" data-tour="${def.key}">
      <span class="qty price">💰${def.cost}</span>
      <span class="icon">🧳</span>
      <span class="name">${cityCount} ${cityCount > 1 ? "Cities" : "City"} Mystery Package</span>
      <span class="effects">⏱ ${def.minutes}m · random cities worldwide</span>
      <span class="effects">🎁 1 souvenir per city</span>
    </div>`;
}

function destinationsPageHTML() {
  const chips = DESTINATIONS.map(
    (d) => `
    <button class="career-chip ${d.key === tourDest ? "active" : ""}" data-dest="${d.key}">
      ${d.emoji} ${d.label}
    </button>`
  ).join("");
  const dest = findDestination(tourDest);
  const visited = state.touring.visited[tourDest] ?? [];
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      <div class="xp-line">${dest.emoji} ${dest.label} · ${visited.length}/${dest.cities.length} cities visited</div>
      <div class="credit-bar">
        <div class="track"><div class="fill" style="width:${(visited.length / dest.cities.length) * 100}%"></div></div>
        <span>${visited.length}/${dest.cities.length}</span>
      </div>
      <div class="city-grid">
        ${dest.cities
          .map((c) => `<span class="city ${visited.includes(c) ? "visited" : ""}">${esc(c)}</span>`)
          .join("")}
      </div>
    </div>`;
  const packages = Array.from({ length: TOUR_MAX_CITIES }, (_, i) =>
    tourPackageCardHTML(i + 1)
  ).join("");
  return head + packages;
}

function sportPackageCardHTML(stopCount) {
  const def = findTour(`sport-any-${stopCount}`);
  return `
    <div class="item ${isSick() ? "disabled" : ""}" data-tour="${def.key}">
      <span class="qty price">💰${def.cost}</span>
      <span class="icon">🎟️</span>
      <span class="name">${stopCount} ${stopCount > 1 ? "Stops" : "Stop"} Mystery Sports Tour</span>
      <span class="effects">⏱ ${def.minutes}m · random teams, any league</span>
      <span class="effects">🎁 1 souvenir per stop</span>
    </div>`;
}

function sportsPageHTML() {
  const chips = SPORT_LEAGUES.map(
    (l) => `
    <button class="career-chip ${l.key === sportLeague ? "active" : ""}" data-league="${l.key}">
      ${l.emoji} ${l.label}
    </button>`
  ).join("");
  const league = findPlace(sportLeague);
  const visited = state.touring.visited[sportLeague] ?? [];
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      <div class="xp-line">${league.emoji} ${league.label} · ${visited.length}/${league.cities.length} teams visited</div>
      <div class="credit-bar">
        <div class="track"><div class="fill" style="width:${(visited.length / league.cities.length) * 100}%"></div></div>
        <span>${visited.length}/${league.cities.length}</span>
      </div>
      <div class="city-grid">
        ${league.cities
          .map((c) => `<span class="city ${visited.includes(c) ? "visited" : ""}">${esc(c)}</span>`)
          .join("")}
      </div>
    </div>`;
  const packages = Array.from({ length: TOUR_MAX_CITIES }, (_, i) =>
    sportPackageCardHTML(i + 1)
  ).join("");
  return head + packages;
}

function journalsPageHTML() {
  if (!state.touring.journals.length) {
    return `<div class="empty-note">No trips yet — pick a package under 🏝️ Destinations!</div>`;
  }
  const rows = state.touring.journals
    .map((j) => {
      // Just two emojis: 🏟️ for sports trips, 🌍 for everything else.
      const sporty = j.destination === "sports" || isLeagueKey(j.destination);
      const dest = { emoji: sporty ? "🏟️" : "🌍" };
      // Every stop reads "Country - City" (or "League - Team").
      const stops = j.cities
        .map((city) => `${esc(cityDestination(city)?.label ?? "?")} - ${esc(city)}`)
        .join(", ");
      return `
      <div class="ach earned journal">
        <span class="ach-emoji">${dest.emoji}</span>
        <span class="ach-label">${stops}</span>
        <span class="ach-date">${esc(j.date)}</span>
      </div>`;
    })
    .join("");
  return `<div class="ach-list">${rows}</div>`;
}

function ticketsPageHTML() {
  const owned = Object.entries(state.tickets).filter(([, count]) => count > 0);
  if (!owned.length) {
    return `<div class="empty-note">No tickets — check 🐱 Pika's daily offers!</div>`;
  }
  return owned
    .map(([key, count]) => {
      const def = findTour(key);
      return `
      <div class="item ${isSick() ? "disabled" : ""}" data-ticket="${esc(key)}">
        <span class="qty">${count}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(def.name)}</span>
        <span class="effects">⏱ ${def.minutes}m · click to travel</span>
      </div>`;
    })
    .join("");
}

function souvenirsPageHTML() {
  const owned = Object.entries(state.souvenirs).filter(([, count]) => count > 0);
  if (!owned.length) {
    return `<div class="empty-note">No souvenirs yet — go 🗺️ Touring to collect them!</div>`;
  }
  return owned
    .map(
      ([city, count]) => `
      <div class="item">
        <span class="qty">${count}</span>
        <span class="icon">🎁</span>
        <span class="name">${esc(souvenirName(city))}</span>
        <span class="effects">Pika might want this…</span>
      </div>`
    )
    .join("");
}

// ── Pika's trading post (Sell / Buy tabs, shop-style cards) ─────────────────
function pikaSellPageHTML() {
  const wants = state.pika.wants ?? [];
  if (!wants.length) {
    return `<div class="empty-note">Pika isn't collecting anything right now — check back soon!</div>`;
  }
  const note = `<div class="ach-section caretaker-title">🐱 Pika is collecting these — she pays +💰${SOUVENIR_SELL_PRICE} each (store refreshes every 3h). Click to add to the 🤝 trade basket.</div>`;
  return (
    note +
    wants
      .map((city) => {
        const owned = state.souvenirs[city] ?? 0;
        const inCart = tradeSell.has(city);
        return `
      <div class="item ${owned > 0 ? "" : "disabled"} ${inCart ? "in-cart" : ""}" data-trade-sell="${esc(city)}">
        <span class="qty pay">+💰${SOUVENIR_SELL_PRICE}</span>
        <span class="icon">🎁</span>
        <span class="name">${esc(souvenirName(city))}</span>
        <span class="effects">${inCart ? "🤝 In trade basket" : owned > 0 ? `You have ${owned}` : "You don't have this yet"}</span>
      </div>`;
      })
      .join("")
  );
}

function pikaBuyPageHTML() {
  const sells = state.pika.sells ?? [];
  if (!sells.length) {
    return `<div class="empty-note">Sold out — new routes &amp; prices in a few hours!</div>`;
  }
  const note = `<div class="ach-section caretaker-title">🎫 Tickets on offer — routes and prices change every 3h. Click to add to the 🤝 trade basket.</div>`;
  return (
    note +
    sells
      .map((offer) => {
        const def = findTour(ticketOfferKey(offer));
        const inCart = tradeBuy.has(offer.id);
        return `
      <div class="item ${inCart ? "in-cart" : ""}" data-trade-buy="${esc(offer.id)}">
        <span class="qty price">💰${offer.price}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(def.name)}</span>
        <span class="effects">${inCart ? "🤝 In trade basket" : `⏱ ${def.minutes}m · one-of-a-kind`}</span>
      </div>`;
      })
      .join("")
  );
}

// ── Achievements page: the full wall of everything earnable ─────────────────
function achRowHTML(emoji, label, earned) {
  return `
    <div class="ach ${earned ? "earned" : ""}">
      <span class="ach-emoji">${emoji}</span>
      <span class="ach-label">${esc(label)}</span>
      <span class="ach-date">${earned ? `✅ ${esc(earned.date)}` : "—"}</span>
    </div>`;
}

function touringAchRows(places) {
  return places.map((place) => {
    const visited = (state.touring.visited[place.key] ?? []).length;
    const earned = state.achievements.find((a) => a.type === "touring" && a.place === place.key);
    return achRowHTML(
      place.emoji,
      `${place.label} Explorer — visit all ${place.cities.length} (${visited}/${place.cities.length})`,
      earned
    );
  });
}

function achievementWallHTML() {
  const rows = [];
  if (achTab === "degrees") {
    for (const subject of SUBJECTS) {
      rows.push(`<div class="ach-section">${subject.emoji} ${subject.label}</div>`);
      for (const stage of SCHOOL_STAGES) {
        const earned = state.achievements.find(
          (a) => a.type === "degree" && a.subject === subject.key && a.stage === stage.key
        );
        rows.push(achRowHTML(subject.emoji, `${stage.label} Diploma in ${subject.label}`, earned));
      }
    }
  } else if (achTab === "careers") {
    for (const career of CAREERS) {
      rows.push(`<div class="ach-section">${career.emoji} ${career.label}</div>`);
      TIERS.forEach((tier, i) => {
        const earned = state.achievements.find(
          (a) => a.type === "career" && a.career === career.key && a.tier === i
        );
        rows.push(achRowHTML(career.emoji, `${career.label} · ${tier.name} Tier Mastered`, earned));
      });
    }
  } else if (achTab === "touring") {
    rows.push(`<div class="ach-section">🗺️ World Explorer</div>`);
    rows.push(...touringAchRows(DESTINATIONS));
  } else {
    rows.push(`<div class="ach-section">🏟️ League Completionist</div>`);
    rows.push(...touringAchRows(SPORT_LEAGUES));
  }
  return `<div class="ach-list">${rows.join("")}</div>`;
}

// ── Pet Center page (registry + caretaker services) ─────────────────────────
// The CARETAKERS catalog lives in items.js (shared with the stats window).
const GOV_FEE = 50;

function caretakerCardHTML(c) {
  const staged = serviceCart.filter((k) => k === c.key).length;
  return `
    <div class="item ${staged ? "in-cart" : ""}" data-caretaker="${c.key}">
      <span class="qty price">💰${c.price}</span>
      <span class="icon">${c.emoji}</span>
      <span class="name">${c.name}</span>
      <span class="effects">${c.desc}</span>
      <span class="effects">${staged ? `🛎️ ${staged} shift${staged > 1 ? "s" : ""} staged` : "4h shift · click to stage"}</span>
    </div>`;
}

function caretakingStatusRowHTML() {
  const c = state.caretaking?.active;
  const current = c
    ? `<span class="plan-active">🛎️ ${c.emoji} ${c.name} on duty · ${formatRemaining(c.remainingMs)} left</span>`
    : `<span class="plan-active idle">No caretaker on duty</span>`;
  const queued = state.caretaking?.plan?.length
    ? `<span class="queued-label">⏳ Up next:</span>` +
      state.caretaking.plan
        .map((key) => `<span class="chip">${findCaretaker(key)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}

function bankHTML() {
  return `
    <div class="settings-card">
      <div class="gov-note">🏦 Pet Bank — savings earn ${(SAVINGS_APR * 100).toFixed(1)}% APR,
      loans cost ${(LOAN_APR * 100).toFixed(1)}% APR (both compound daily). Loan limit 💰${LOAN_LIMIT.toLocaleString()}.</div>
      <div class="settings-row"><label>💰 Pocket</label><span id="bank-pocket" class="bank-num">${state.coins.toLocaleString()}</span></div>
      <div class="settings-row"><label>🏦 Savings</label><span id="bank-savings" class="bank-num">${state.bank.savings.toLocaleString()}</span></div>
      <div class="settings-row"><label>💳 Loan</label><span id="bank-loan" class="bank-num">${state.bank.loan.toLocaleString()}</span></div>
      <div class="settings-row"><label>📈 Net worth</label><span id="bank-net" class="bank-num">${(state.coins + state.bank.savings - state.bank.loan).toLocaleString()}</span></div>
      <div class="settings-row">
        <label for="bank-amount">Amount</label>
        <input type="number" id="bank-amount" min="1" placeholder="0" />
      </div>
      <div class="settings-actions">
        <button id="bank-deposit">Deposit</button>
        <button id="bank-withdraw">Withdraw</button>
        <button id="bank-borrow">Borrow</button>
        <button id="bank-repay">Repay</button>
      </div>
    </div>`;
}

// Live-update the bank numbers without rebuilding the form (keeps typing).
function refreshBankNumbers() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value.toLocaleString();
  };
  set("bank-pocket", state.coins);
  set("bank-savings", state.bank.savings);
  set("bank-loan", state.bank.loan);
  set("bank-net", state.coins + state.bank.savings - state.bank.loan);
}

function registryHTML() {
  return `
    <div class="settings-card">
      <div class="gov-note">📋 Pet Registry — update your pet's official record. Service fee: 💰${GOV_FEE}<br/>
      Breed: <b>${esc(findSpecies(state.species).breed)}</b> (set by species — visit 🔮 Magic Station to change)</div>
      <div class="settings-row">
        <label for="gov-name">Name</label>
        <input type="text" id="gov-name" maxlength="20" value="${esc(state.name)}" />
      </div>
      <div class="settings-row">
        <label for="gov-callme">Calls you</label>
        <input type="text" id="gov-callme" maxlength="12" value="${esc(state.callMe)}" placeholder="Papa / Mama / Dada…" />
      </div>
      <div class="settings-actions">
        <button id="gov-apply" disabled>Apply changes (💰${GOV_FEE})</button>
      </div>
    </div>`;
}

function caretakersHTML() {
  return (
    `<div class="school-head">${caretakingStatusRowHTML()}</div>` +
    `<div class="ach-section caretaker-title">🧑‍🍼 Caretaker services — stage shifts, then hire via the 🛎️ basket. A shift charges when it starts and refunds prorated if ended early.</div>` +
    CARETAKERS.map(caretakerCardHTML).join("")
  );
}

let pendingMagic = null; // species key awaiting purchase confirmation

function magicStationHTML() {
  if (pendingMagic) {
    const target = findSpecies(pendingMagic);
    const fee = target.price;
    return `
      <div class="settings-card">
        <div class="gov-note">🔮 Confirm purchase</div>
        <div class="magic-confirm-row">
          <span class="species-thumb" style="background-image:url('${target.sheet}')"></span>
          <div>
            <b>Purchase the ${esc(target.breed)} form for ${esc(state.name)}?</b><br/>
            <span class="gov-note">One-time price: 💰${fee} — ${esc(state.name)} becomes a ${esc(target.breed)} right away, and owned forms switch freely afterwards.</span>
          </div>
        </div>
        <div class="settings-actions">
          <button id="magic-cancel">Cancel</button>
          <button id="magic-confirm" ${state.coins >= fee ? "" : "disabled"}>
            ${state.coins >= fee ? `Pay 💰${fee} &amp; purchase` : "Not enough coins"}
          </button>
        </div>
      </div>`;
  }
  const cards = SPECIES.map((s) => {
    const current = s.key === state.species;
    const owned = state.forms.includes(s.key);
    const badge = current
      ? `<span class="qty">now</span>`
      : owned
        ? `<span class="qty">owned</span>`
        : `<span class="qty price">💰${s.price}</span>`;
    const line = current
      ? "Your current form"
      : owned
        ? "Owned · click to switch"
        : "Click to purchase this form";
    return `
      <div class="item ${current ? "disabled" : ""}" ${current ? "" : `data-magic="${s.key}"`}>
        ${badge}
        <span class="species-thumb" style="background-image:url('${s.sheet}')"></span>
        <span class="name">${esc(s.breed)}</span>
        <span class="effects">${line}</span>
      </div>`;
  }).join("");
  return (
    `<div class="ach-section caretaker-title">🔮 Magic Station — buy new forms once, then switch between owned forms anytime. Name, stats, and memories always stay.</div>` +
    cards
  );
}

function refreshGovApply() {
  const btn = document.getElementById("gov-apply");
  const nameInput = document.getElementById("gov-name");
  const callMeInput = document.getElementById("gov-callme");
  if (!btn || !nameInput || !callMeInput) return;
  const name = nameInput.value.trim();
  const callMe = callMeInput.value.trim();
  const changed = (name && name !== state.name) || (callMe && callMe !== state.callMe);
  btn.disabled = !changed || state.coins < GOV_FEE;
  btn.textContent = state.coins < GOV_FEE ? "Not enough coins" : `Apply changes (💰${GOV_FEE})`;
}

// ── Add-on bridge ───────────────────────────────────────────────────────────
// Add-on pages run in sandboxed iframes and talk to the app through
// postMessage: {reqId, type, payload} in, {reqId, result, error} out.
// Supported requests: pick-folder, list-music, file-url, notify,
// open-window, widget-set, widget-push. (See ADDONS.md.)
function addonFrame(id) {
  return [...document.querySelectorAll("#addon-host iframe")].find(
    (f) => f.dataset.addon === id
  );
}

async function handleAddonRequest(id, type, payload) {
  if (type === "pick-folder") {
    return invoke("plugin:dialog|open", {
      options: { title: "Choose a folder", directory: true, multiple: false },
    });
  }
  if (type === "list-music") {
    return invoke("list_music", { dir: String(payload?.dir ?? "~/Music") });
  }
  if (type === "file-url") {
    return convertFileSrc(String(payload?.path ?? ""));
  }
  if (type === "notify") {
    return invoke("notify", {
      title: String(payload?.title ?? "MyPet"),
      body: String(payload?.body ?? ""),
    });
  }
  if (type === "open-window") {
    return invoke("open_addon_window", {
      id,
      page: String(payload?.page ?? ""),
      width: Number(payload?.width) || 480,
      height: Number(payload?.height) || 360,
      title: String(payload?.title ?? ""),
    });
  }
  if (type === "widget-set") {
    await emit("addon-widget-set", { id, on: !!payload?.on });
    return true;
  }
  if (type === "widget-push") {
    await emit("addon-widget-state", { id, state: payload?.state ?? null });
    return true;
  }
  throw new Error(`unknown bridge request: ${type}`);
}

window.addEventListener("message", async (e) => {
  const frame = [...document.querySelectorAll("#addon-host iframe")].find(
    (f) => f.contentWindow === e.source
  );
  if (!frame) return;
  const { reqId, type, payload } = e.data ?? {};
  if (typeof reqId === "undefined") return;
  let result = null;
  let error = null;
  try {
    result = await handleAddonRequest(frame.dataset.addon, type, payload);
  } catch (err) {
    error = String(err?.message ?? err);
  }
  frame.contentWindow.postMessage({ reqId, result, error }, "*");
});

// Buttons pressed in a tray mini-widget come back through the stats window
// and get forwarded to the add-on's main page.
listen("addon-widget-action", ({ payload }) => {
  addonFrame(payload.id)?.contentWindow?.postMessage(
    { type: "widget-action", payload: payload.payload },
    "*"
  );
});

// ── Settings page ───────────────────────────────────────────────────────────
let resetPending = false;

function resetConfirmHTML() {
  return `
    <div class="settings-plain">
      <div class="ach-section">Reset all data</div>
      <div class="gov-note">⚠️ <b>Reset everything?</b><br/>
      This permanently deletes ALL progress — coins, school, careers, tours, achievements, everything —
      and restarts as a brand-new game. Type <b>${esc(state.name)}</b> to confirm.</div>
      <div class="settings-row">
        <label for="reset-name">Pet's name</label>
        <input type="text" id="reset-name" placeholder="${esc(state.name)}" />
      </div>
      <div class="settings-actions">
        <button id="reset-cancel">Cancel</button>
        <button id="reset-confirm" class="danger" disabled>Delete everything</button>
      </div>
    </div>`;
}

function settingsHTML() {
  if (resetPending) return resetConfirmHTML();
  return `
    <div class="settings-plain">
      <div class="ach-section">General</div>
      <div class="settings-row">
        <label for="size">Pet size (%)</label>
        <input type="number" id="size" class="num-input" min="50" max="150" step="5"
          value="${Math.round(appSettings.scale * 100)}" />
      </div>
      <div class="settings-row">
        <label for="all-desktops">Show on all desktops</label>
        <input type="checkbox" id="all-desktops" ${appSettings.allDesktops ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label for="autostart">Show up when computer starts</label>
        <input type="checkbox" id="autostart" />
      </div>
      <div class="settings-row">
        <label for="hide-pet">Hide my pet</label>
        <input type="checkbox" id="hide-pet" />
      </div>
      <div class="settings-links">
        <a id="quit" class="danger-link">Quit the app</a>
        <a id="reset-btn" class="danger-link">Reset all data…</a>
      </div>

      <div class="ach-section">Developer mode</div>
      <div class="settings-row">
        <label for="dev-mode">Fast game time (care decays every 10s; 1 game-minute = 5s)</label>
        <input type="checkbox" id="dev-mode" ${appSettings.devMode ? "checked" : ""} />
      </div>
    </div>`;
}

let addonMsg = "";

// The add-on manager: a drawer on the Add-ons homepage (like the shopping
// cart), listing installed add-ons with uninstall + a zip installer.
function renderAddonDrawer() {
  const drawer = document.getElementById("addon-drawer");
  if (drawer.hidden) return;
  const rows =
    addonList(state.addonsInstalled)
      .map((a) => {
        const pinned = state.pinnedAddons.includes(a.id);
        return `
      <div class="cart-row addon-line">
        <span class="addon-line-label">${esc(a.emoji)} ${esc(a.name)}</span>
        <button class="icon-btn pin ${pinned ? "on" : ""}" data-pin="${esc(a.id)}"
          title="${pinned ? "Unpin from" : "Pin to"} the tray and side panel">📌</button>
        <button class="icon-btn" data-uninstall="${esc(a.id)}" title="Uninstall ${esc(a.name)}">🗑️</button>
      </div>`;
      })
      .join("") || `<div class="cart-empty">No add-ons installed yet</div>`;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-actions">
      <button id="addon-install">📦 Install add-on from zip…</button>
    </div>
    ${addonMsg ? `<div class="gov-note">${esc(addonMsg)}</div>` : ""}`;
}

async function installAddonFlow() {
  try {
    const path = await invoke("plugin:dialog|open", {
      options: {
        title: "Choose an add-on zip",
        filters: [{ name: "Add-on zip", extensions: ["zip"] }],
        multiple: false,
        directory: false,
      },
    });
    if (!path) return;
    const manifest = await invoke("install_addon", { path });
    addonMsg = `Installed ${manifest.name ?? manifest.id} ✔`;
    // On reinstall, kill the old build's running page and tray widget so the
    // next open loads the freshly extracted files instead of the stale iframe.
    addonFrame(manifest.id)?.remove();
    emit("addon-widget-set", { id: manifest.id, on: false });
    emit("addons-changed");
    state.addonsInstalled = await invoke("list_installed_addons");
  } catch (e) {
    addonMsg = `Install failed: ${e}`;
  }
  if (view === "addons") renderGrid();
  renderAddonDrawer();
  renderSidePanel();
}

async function uninstallAddonFlow(id) {
  try {
    await invoke("uninstall_addon", { id });
    addonMsg = `Uninstalled ${id} ✔`;
    emit("addons-changed");
    state.addonsInstalled = await invoke("list_installed_addons");
    // Kill its running page (stops any playback) and its tray widget.
    addonFrame(id)?.remove();
    emit("addon-widget-set", { id, on: false });
  } catch (e) {
    addonMsg = `Uninstall failed: ${e}`;
  }
  if (view === "addons") renderGrid();
  renderAddonDrawer();
  renderSidePanel();
}

async function refreshHidePet() {
  const box = document.getElementById("hide-pet");
  if (!box) return;
  const petWin = await WebviewWindow.getByLabel("main");
  box.checked = !(await petWin.isVisible());
}

async function refreshAutostart() {
  const box = document.getElementById("autostart");
  if (!box) return;
  try {
    box.checked = await invoke("plugin:autostart|is_enabled");
  } catch (e) {
    console.error("autostart state failed:", e);
  }
}

// ── Grid ────────────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById("grid");

  // Add-on iframes live OUTSIDE the grid in #addon-host so they survive view
  // switches (music keeps playing while you browse other pages). Grid and
  // host are flex siblings, so exactly one of them must be hidden at a time
  // or they split the panel — do it up here because most views return early
  // below. (The add-on branch un-hides the grid again for its error notes.)
  const host = document.getElementById("addon-host");
  host.hidden = !view.startsWith("addon:");
  grid.hidden = view.startsWith("addon:");

  if (view === "home") {
    if (homeTab === "souvenirs") {
      grid.innerHTML = souvenirsPageHTML();
      return;
    }
    if (homeTab === "tickets") {
      grid.innerHTML = ticketsPageHTML();
      return;
    }
    const category = ITEM_CATALOG.find((c) => c.key === homeTab);
    const stocked = category.items.filter((item) => state.bag[item.key] > 0);
    let note = "";
    let exhausted = false;
    if (homeTab === "homework") {
      const today = new Date().toISOString().slice(0, 10);
      const used = state.homework?.date === today ? state.homework.count : 0;
      const left = Math.max(0, HOMEWORK_DAILY_LIMIT - used);
      exhausted = left === 0;
      note = `<div class="ach-section caretaker-title">✏️ Homework left today: ${left}/${HOMEWORK_DAILY_LIMIT}${exhausted ? " — come back tomorrow!" : ""}</div>`;
    }
    grid.innerHTML =
      note +
      (stocked.length
        ? stocked.map((item) => homeCardHTML(item, exhausted)).join("")
        : `<div class="empty-note">Nothing here — stock up in the 🧺 Life view!</div>`);
    return;
  }

  if (view === "shopping") {
    const store = SHOP_CATALOG.find((c) => c.key === shopTab);
    grid.innerHTML = store.sells.map((key) => shopCardHTML(findSellable(key))).join("");
    return;
  }

  if (view === "career") {
    if (careerTab === "school") {
      grid.innerHTML = schoolPageHTML();
    } else {
      grid.innerHTML = jobPageHTML();
    }
    return;
  }

  if (view === "touring") {
    grid.innerHTML =
      touringTab === "journals"
        ? journalsPageHTML()
        : touringTab === "sports"
          ? sportsPageHTML()
          : destinationsPageHTML();
    return;
  }

  if (view === "achievements") {
    grid.innerHTML = achievementWallHTML();
    return;
  }

  // Adventure: the pet's own game world — a function of the app (not an
  // add-on), but a fully separate ecosystem (Paw Tokens ≠ coins, recruit
  // levels ≠ traits) with its own save. Lives in adventure.js; it reads only
  // the pet's name. Design doc: ADVENTURE.md.
  if (view === "adventure") {
    grid.innerHTML = adventurePageHTML(state.name);
    return;
  }

  // Add-ons homepage: an iPhone-style springboard of app tiles. The 🧰
  // manager (top right) installs/uninstalls.
  if (view === "addons") {
    const addons = addonList(state.addonsInstalled);
    grid.innerHTML = addons.length
      ? `<div class="app-grid">${addons
          .map(
            (a) => `
        <button class="app-tile" data-open-addon="${esc(a.id)}">
          <span class="app-icon">${esc(a.emoji)}</span>
          <span class="app-name">${esc(a.name)}</span>
        </button>`
          )
          .join("")}</div>`
      : `<div class="empty-note">No add-ons yet — open the 🧰 manager (top right) to install one.</div>`;
    return;
  }

  if (view === "government") {
    if (petcenterTab === "caretakers") grid.innerHTML = caretakersHTML();
    else if (petcenterTab === "magic") grid.innerHTML = magicStationHTML();
    else if (petcenterTab === "bank") grid.innerHTML = bankHTML();
    else {
      grid.innerHTML = registryHTML();
      refreshGovApply();
    }
    return;
  }

  // One live iframe per opened add-on: switching between add-ons hides the
  // others instead of destroying them, so several can keep running at once
  // (music playing while another add-on's page stays active).
  if (view.startsWith("addon:")) {
    const id = view.slice(6);
    const addon = state.addonsInstalled.find((a) => a.id === id);
    grid.innerHTML = "";
    if (!addon) {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">This add-on is not installed.</div>`;
    } else if (addon.entry && addon.dir) {
      let frame = addonFrame(id);
      if (!frame) {
        frame = document.createElement("iframe");
        frame.className = "addon-frame";
        frame.dataset.addon = id;
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
        frame.src = convertFileSrc(`${addon.dir}/${addon.entry}`);
        host.appendChild(frame);
      }
      for (const f of host.querySelectorAll("iframe")) {
        f.classList.toggle("bg", f !== frame);
      }
    } else {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">${esc(addon.name ?? id)} has no page.</div>`;
    }
    return;
  }

  if (view === "pika") {
    grid.innerHTML = pikaTab === "buy" ? pikaBuyPageHTML() : pikaSellPageHTML();
    return;
  }

  if (view === "settings") {
    grid.innerHTML = settingsHTML();
    refreshHidePet();
    refreshAutostart();
  }
}

function renderAll() {
  renderSidePanel();
  renderTopbar();
  renderCartDrawer();
  renderPlanDrawer();
  renderTradeDrawer();
  renderServiceDrawer();
  renderAddonDrawer();
  renderTabs();
  renderGrid();
}

function setView(v) {
  if (!VIEWS[v] && !v.startsWith("addon:")) return;
  view = v;
  pendingMagic = null;
  resetPending = false;
  document.getElementById("cart-drawer").hidden = true;
  document.getElementById("plan-drawer").hidden = true;
  document.getElementById("trade-drawer").hidden = true;
  document.getElementById("service-drawer").hidden = true;
  document.getElementById("addon-drawer").hidden = true;
  renderAll();
}

// ── Events ──────────────────────────────────────────────────────────────────
document.querySelector("#side footer").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view]");
  if (btn) setView(btn.dataset.view);
});

document.getElementById("side-status").addEventListener("click", (e) => {
  if (e.target.id === "side-stop-activity") emit("end-activity");
  else if (e.target.id === "side-stop-care") emit("end-caretaking");
});

document.getElementById("side-addons").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-addon]");
  if (btn) setView(`addon:${btn.dataset.addon}`);
});

// ── VSCode-style resizable side panel ───────────────────────────────────────
{
  const side = document.getElementById("side");
  const splitter = document.getElementById("splitter");
  const savedWidth = Number(localStorage.getItem("sideWidth"));
  if (savedWidth >= 240 && savedWidth <= 460) side.style.flexBasis = `${savedWidth}px`;
  let dragging = false;
  splitter.addEventListener("mousedown", (e) => {
    dragging = true;
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const width = Math.min(460, Math.max(240, e.clientX));
    side.style.flexBasis = `${width}px`;
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    localStorage.setItem("sideWidth", parseInt(side.style.flexBasis, 10) || 232);
  });
}

document.getElementById("cart-btn").addEventListener("click", () => {
  const drawer = document.getElementById("cart-drawer");
  drawer.hidden = !drawer.hidden;
  renderCartDrawer();
});

// Back to the Add-ons homepage from an open add-on page. The add-on's iframe
// stays alive in #addon-host, so this doesn't interrupt whatever it's doing.
document.getElementById("addons-home-btn").addEventListener("click", () => setView("addons"));

document.getElementById("manager-btn").addEventListener("click", () => {
  const drawer = document.getElementById("addon-drawer");
  drawer.hidden = !drawer.hidden;
  renderAddonDrawer();
});

// Add-on manager drawer: install, uninstall, pin.
document.getElementById("addon-drawer").addEventListener("click", (e) => {
  if (e.target.id === "addon-install") {
    installAddonFlow();
    return;
  }
  const pinBtn = e.target.closest("[data-pin]");
  if (pinBtn) {
    const id = pinBtn.dataset.pin;
    emit("addon-pin", { id, pinned: !state.pinnedAddons.includes(id) });
    return;
  }
  const uninstallBtn = e.target.closest("[data-uninstall]");
  if (uninstallBtn) uninstallAddonFlow(uninstallBtn.dataset.uninstall);
});

document.getElementById("plan-btn").addEventListener("click", () => {
  const drawer = document.getElementById("plan-drawer");
  drawer.hidden = !drawer.hidden;
  renderPlanDrawer();
});

document.getElementById("trade-btn").addEventListener("click", () => {
  const drawer = document.getElementById("trade-drawer");
  drawer.hidden = !drawer.hidden;
  renderTradeDrawer();
});

document.getElementById("service-btn").addEventListener("click", () => {
  const drawer = document.getElementById("service-drawer");
  drawer.hidden = !drawer.hidden;
  renderServiceDrawer();
});

document.getElementById("service-drawer").addEventListener("click", (e) => {
  const remove = e.target.closest("[data-service-remove]");
  if (remove) {
    serviceCart.splice(Number(remove.dataset.serviceRemove), 1);
    renderServiceBadge();
    renderServiceDrawer();
    renderGrid();
    return;
  }
  if (e.target.id === "service-clear") {
    serviceCart = [];
    renderServiceBadge();
    renderServiceDrawer();
    renderGrid();
    return;
  }
  if (e.target.id === "service-hire") {
    if (serviceCart.length) {
      emit("hire-caretakers", { keys: [...serviceCart] });
      serviceCart = [];
      document.getElementById("service-drawer").hidden = true;
      renderServiceBadge();
      renderGrid();
    }
  }
});

document.getElementById("trade-drawer").addEventListener("click", (e) => {
  const removeSell = e.target.closest("[data-trade-remove-sell]");
  if (removeSell) {
    tradeSell.delete(removeSell.dataset.tradeRemoveSell);
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
    return;
  }
  const removeBuy = e.target.closest("[data-trade-remove-buy]");
  if (removeBuy) {
    tradeBuy.delete(removeBuy.dataset.tradeRemoveBuy);
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
    return;
  }
  if (e.target.id === "trade-clear") {
    tradeSell.clear();
    tradeBuy.clear();
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
    return;
  }
  if (e.target.id === "trade-checkout") {
    emit("pika-checkout", { sold: [...tradeSell], bought: [...tradeBuy.keys()] });
  }
});

listen("pika-result", ({ payload }) => {
  if (payload.ok) {
    tradeSell.clear();
    tradeBuy.clear();
    document.getElementById("trade-drawer").hidden = true;
    renderTradeBadge();
    renderGrid();
  } else {
    // Stale offers (store refreshed) — drop anything no longer on sale.
    const liveIds = new Set((state.pika.sells ?? []).map((o) => o.id));
    for (const id of [...tradeBuy.keys()]) if (!liveIds.has(id)) tradeBuy.delete(id);
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
  }
});

document.getElementById("cart-drawer").addEventListener("click", (e) => {
  const remove = e.target.closest("[data-remove]");
  if (remove) {
    cart.delete(remove.dataset.remove);
    renderCartBadge();
    renderCartDrawer();
    return;
  }
  if (e.target.id === "cart-clear") {
    cart.clear();
    renderCartBadge();
    renderCartDrawer();
    return;
  }
  if (e.target.id === "cart-checkout") {
    emit("buy-cart", { items: [...cart].map(([key, qty]) => ({ key, qty })) });
  }
});

document.getElementById("plan-drawer").addEventListener("click", (e) => {
  const remove = e.target.closest("[data-plan-remove]");
  if (remove) {
    planBook.splice(Number(remove.dataset.planRemove), 1);
    renderPlanBadge();
    renderPlanDrawer();
    return;
  }
  if (e.target.id === "plan-clear") {
    planBook = [];
    renderPlanBadge();
    renderPlanDrawer();
    return;
  }
  if (e.target.id === "plan-start") {
    if (planBook.length) {
      emit("start-plan", { entries: [...planBook] });
      planBook = [];
      document.getElementById("plan-drawer").hidden = true;
      renderPlanBadge();
    }
  }
});

listen("cart-result", ({ payload }) => {
  if (payload.ok) {
    cart.clear();
    document.getElementById("cart-drawer").hidden = true;
    renderCartBadge();
  } else {
    renderCartDrawer();
  }
});

document.getElementById("tabs").addEventListener("click", (e) => {
  const tab = e.target.closest("[data-tab]");
  if (!tab) return;
  if (view === "home") homeTab = tab.dataset.tab;
  else if (view === "shopping") shopTab = tab.dataset.tab;
  else if (view === "career") careerTab = tab.dataset.tab;
  else if (view === "touring") touringTab = tab.dataset.tab;
  else if (view === "achievements") achTab = tab.dataset.tab;
  else if (view === "pika") pikaTab = tab.dataset.tab;
  else if (view === "adventure") advTab = tab.dataset.tab;
  else if (view === "government") {
    petcenterTab = tab.dataset.tab;
    pendingMagic = null;
  }
  renderTabs();
  renderGrid();
});

document.getElementById("grid").addEventListener("click", (e) => {
  // The adventure world handles its own clicks (adventure.js) and just needs
  // a repaint afterwards.
  if (view === "adventure") {
    if (advHandleClick(e)) renderGrid();
    return;
  }

  const appTile = e.target.closest("[data-open-addon]");
  if (appTile) {
    setView(`addon:${appTile.dataset.openAddon}`);
    return;
  }

  const useCard = e.target.closest("[data-use]");
  if (useCard) {
    emit("use-item", { key: useCard.dataset.use });
    return;
  }

  const addCard = e.target.closest("[data-add]");
  if (addCard) {
    const key = addCard.dataset.add;
    flyEmoji(findSellable(key).emoji, addCard, document.getElementById("cart-btn"));
    cart.set(key, (cart.get(key) ?? 0) + 1);
    renderCartBadge();
    renderCartDrawer();
    return;
  }

  const classCard = e.target.closest("[data-plan-class]");
  if (classCard) {
    const cls = findClass(classCard.dataset.planClass);
    flyEmoji(cls.emoji, classCard, document.getElementById("plan-btn"));
    planBook.push({ type: "class", key: cls.key });
    renderPlanBadge();
    renderPlanDrawer();
    return;
  }

  const jobCard = e.target.closest("[data-plan-job]");
  if (jobCard) {
    const job = findJob(jobCard.dataset.planJob);
    flyEmoji(job.emoji, jobCard, document.getElementById("plan-btn"));
    planBook.push({ type: "job", key: job.key });
    renderPlanBadge();
    renderPlanDrawer();
    return;
  }

  const careerChip = e.target.closest("[data-career]");
  if (careerChip) {
    jobCareer = careerChip.dataset.career;
    renderGrid();
    return;
  }

  const subjectChip = e.target.closest("[data-subject]");
  if (subjectChip) {
    schoolSubject = subjectChip.dataset.subject;
    renderGrid();
    return;
  }

  const destChip = e.target.closest("[data-dest]");
  if (destChip) {
    tourDest = destChip.dataset.dest;
    renderGrid();
    return;
  }

  const leagueChip = e.target.closest("[data-league]");
  if (leagueChip) {
    sportLeague = leagueChip.dataset.league;
    renderGrid();
    return;
  }

  const tourCard = e.target.closest("[data-tour]");
  if (tourCard) {
    // Tours start (or queue) immediately — no plan book needed.
    emit("start-plan", { entries: [{ type: "tour", key: tourCard.dataset.tour }] });
    return;
  }

  const tradeSellCard = e.target.closest("[data-trade-sell]");
  if (tradeSellCard) {
    const city = tradeSellCard.dataset.tradeSell;
    if (tradeSell.has(city)) tradeSell.delete(city);
    else {
      flyEmoji("🎁", tradeSellCard, document.getElementById("trade-btn"));
      tradeSell.add(city);
    }
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
    return;
  }

  const tradeBuyCard = e.target.closest("[data-trade-buy]");
  if (tradeBuyCard) {
    const id = tradeBuyCard.dataset.tradeBuy;
    if (tradeBuy.has(id)) tradeBuy.delete(id);
    else {
      const offer = (state.pika.sells ?? []).find((o) => o.id === id);
      if (!offer) return;
      flyEmoji("🎫", tradeBuyCard, document.getElementById("trade-btn"));
      tradeBuy.set(id, offer);
    }
    renderTradeBadge();
    renderTradeDrawer();
    renderGrid();
    return;
  }

  const ticketCard = e.target.closest("[data-ticket]");
  if (ticketCard) {
    emit("use-ticket", { key: ticketCard.dataset.ticket });
    return;
  }

  const caretakerCard = e.target.closest("[data-caretaker]");
  if (caretakerCard) {
    const key = caretakerCard.dataset.caretaker;
    flyEmoji(findCaretaker(key).emoji, caretakerCard, document.getElementById("service-btn"));
    serviceCart.push(key);
    renderServiceBadge();
    renderServiceDrawer();
    renderGrid();
    return;
  }

  const magicCard = e.target.closest("[data-magic]");
  if (magicCard) {
    const key = magicCard.dataset.magic;
    if (state.forms.includes(key)) {
      emit("gov-magic", { species: key }); // owned: switch instantly, free
    } else {
      pendingMagic = key; // purchases ask for confirmation first
      renderGrid();
    }
    return;
  }
  if (e.target.id === "magic-confirm") {
    emit("gov-magic", { species: pendingMagic });
    pendingMagic = null;
    renderGrid();
    return;
  }
  if (e.target.id === "magic-cancel") {
    pendingMagic = null;
    renderGrid();
    return;
  }

  switch (e.target.id) {
    case "gov-apply": {
      const name = document.getElementById("gov-name").value.trim();
      const callMe = document.getElementById("gov-callme").value.trim();
      emit("gov-update", { name, callMe });
      break;
    }
    case "quit":
      invoke("quit");
      break;
    case "reset-btn":
      resetPending = true;
      renderGrid();
      break;
    case "reset-cancel":
      resetPending = false;
      renderGrid();
      break;
    case "reset-confirm": {
      const typed = document.getElementById("reset-name").value.trim();
      if (typed.toLowerCase() === state.name.toLowerCase()) {
        invoke("reset_app");
      }
      break;
    }
    case "bank-deposit":
    case "bank-withdraw":
    case "bank-borrow":
    case "bank-repay": {
      const input = document.getElementById("bank-amount");
      emit("bank-op", { op: e.target.id.slice(5), amount: Number(input.value) });
      input.value = "";
      break;
    }
  }
});

// Settings/government controls (delegated so re-renders keep working).
document.getElementById("grid").addEventListener("input", (e) => {
  if (["gov-name", "gov-callme"].includes(e.target.id)) {
    refreshGovApply();
  } else if (e.target.id === "reset-name") {
    const btn = document.getElementById("reset-confirm");
    if (btn) btn.disabled = e.target.value.trim().toLowerCase() !== state.name.toLowerCase();
  }
});

document.getElementById("grid").addEventListener("change", (e) => {
  if (e.target.id === "size") {
    const pct = Math.min(150, Math.max(50, Math.round(Number(e.target.value) || 75)));
    e.target.value = pct;
    appSettings.scale = pct / 100;
    emit("settings-changed", { ...appSettings });
  } else if (e.target.id === "all-desktops") {
    appSettings.allDesktops = e.target.checked;
    emit("settings-changed", { ...appSettings });
  } else if (e.target.id === "dev-mode") {
    appSettings.devMode = e.target.checked;
    emit("settings-changed", { ...appSettings });
  } else if (e.target.id === "autostart") {
    invoke(e.target.checked ? "plugin:autostart|enable" : "plugin:autostart|disable").catch(
      (err) => console.error("autostart toggle failed:", err)
    );
  } else if (e.target.id === "hide-pet") {
    (async () => {
      const petWin = await WebviewWindow.getByLabel("main");
      if (e.target.checked) await petWin.hide();
      else await petWin.show();
    })();
  }
});

// ── State sync ──────────────────────────────────────────────────────────────
function applyState(saved) {
  if (typeof saved.name === "string" && saved.name.trim()) state.name = saved.name.trim();
  if (SPECIES.some((s) => s.key === saved.species)) state.species = saved.species;
  if (Array.isArray(saved.forms)) state.forms = saved.forms;
  if (!state.forms.includes(state.species)) state.forms.push(state.species);
  if (typeof saved.callMe === "string" && saved.callMe.trim()) state.callMe = saved.callMe.trim();
  if (typeof saved.coins === "number") state.coins = saved.coins;
  if (Array.isArray(saved.achievements)) state.achievements = saved.achievements;
  for (const key of Object.keys(state.care)) {
    if (typeof saved.care?.[key] === "number") state.care[key] = saved.care[key];
  }
  for (const key of Object.keys(state.traits)) {
    if (typeof saved.traits?.[key] === "number") state.traits[key] = saved.traits[key];
  }
  for (const key of Object.keys(state.bag)) {
    if (typeof saved.bag?.[key] === "number") state.bag[key] = saved.bag[key];
  }
  if (saved.school?.subjects) {
    state.school.subjects = { ...state.school.subjects, ...saved.school.subjects };
  }
  if (saved.career?.xp) {
    state.career.xp = { ...state.career.xp, ...saved.career.xp };
  }
  if (saved.activity) {
    state.activity = { plan: saved.activity.plan ?? [], active: saved.activity.active ?? null };
  }
  if (saved.caretaking) {
    state.caretaking = {
      plan: saved.caretaking.plan ?? [],
      active: saved.caretaking.active ?? null,
    };
  }
  if (saved.touring) {
    if (saved.touring.visited) {
      state.touring.visited = { ...state.touring.visited, ...saved.touring.visited };
    }
    if (Array.isArray(saved.touring.journals)) state.touring.journals = saved.touring.journals;
  }
  if (saved.souvenirs && typeof saved.souvenirs === "object") state.souvenirs = saved.souvenirs;
  if (saved.tickets && typeof saved.tickets === "object") state.tickets = saved.tickets;
  if (saved.pika && typeof saved.pika === "object") {
    state.pika = { sells: [], ...state.pika, ...saved.pika };
  }
  if (saved.bank && typeof saved.bank === "object") {
    state.bank = { ...state.bank, ...saved.bank };
  }
  if (saved.homework && typeof saved.homework === "object") {
    state.homework = saved.homework;
  }
  if (Array.isArray(saved.addonsInstalled)) {
    state.addonsInstalled = saved.addonsInstalled;
  }
  if (Array.isArray(saved.pinnedAddons)) {
    state.pinnedAddons = saved.pinnedAddons;
  }
  if (saved.settings && typeof saved.settings === "object") {
    if (typeof saved.settings.scale === "number") appSettings.scale = saved.settings.scale;
    if (typeof saved.settings.allDesktops === "boolean") {
      appSettings.allDesktops = saved.settings.allDesktops;
    }
    if (typeof saved.settings.devMode === "boolean") {
      appSettings.devMode = saved.settings.devMode;
    }
  }
}

listen("pet-state", ({ payload }) => {
  applyState(payload);
  renderSidePanel();
  renderCartDrawer();
  renderPlanDrawer();
  renderAddonDrawer(); // pin toggles reflect the broadcast state
  // Don't re-render form views under the user's cursor/keyboard.
  const isForm =
    view === "settings" ||
    view.startsWith("addon:") ||
    (view === "government" && (petcenterTab === "registry" || petcenterTab === "bank"));
  if (!isForm) renderGrid();
  else if (view === "government" && petcenterTab === "registry") refreshGovApply();
  else if (view === "government" && petcenterTab === "bank") refreshBankNumbers();
});

// The popover / pet context menu pick which view to open.
listen("hub-view", ({ payload }) => setView(payload.view));

// WebKit may suspend this webview while it's hidden, losing pet-state
// broadcasts. Re-sync from the save file whenever the window comes back.
window.addEventListener("focus", async () => {
  try {
    const raw = await invoke("load_state");
    if (raw) applyState(JSON.parse(raw));
  } catch (e) {
    console.error("focus refresh failed:", e);
  }
  renderSidePanel();
  renderCartDrawer();
  renderPlanDrawer();
  if (view !== "settings" && view !== "government") renderGrid();
});

// Initial state from the save file (live broadcasts take over afterwards).
(async () => {
  try {
    state.addonsInstalled = await invoke("list_installed_addons");
  } catch (e) {
    console.error("addon scan failed:", e);
  }
  try {
    const raw = await invoke("load_state");
    if (raw) {
      const saved = JSON.parse(raw);
      applyState(saved);
      // The save stores activity.active as elapsed/duration; approximate the
      // live view until the first pet-state broadcast arrives.
      const a = saved.activity?.active;
      if (a) {
        const def = a.type === "job" ? findJob(a.key) : findClass(a.key);
        state.activity.active = def
          ? {
              type: a.type,
              key: a.key,
              name: def.name,
              emoji: def.emoji,
              durationMs: a.durationMs,
              remainingMs: Math.max(0, a.durationMs - (a.elapsedMs ?? 0)),
            }
          : null;
      }
    }
  } catch (e) {
    console.error("failed to load hub state:", e);
  }
  renderAll();
})();

window.addEventListener("contextmenu", (e) => e.preventDefault());
jlog("script eval complete");
