// stats/initEvents.js — ALL event wiring of the stats window: the Tauri
// event listeners (bank ops, extension registry + tray widgets, Pika checkout,
// tickets, item use, cart checkout, activity plans, caretaking, government
// registry, setup, settings) and the popover's own DOM listeners.

import { emit, invoke, listen } from "../shared/tauri.js";
import { setLanguage } from "../shared/i18n.js";
import {
  ALL_ITEMS,
  ITEM_CATALOG,
  CUSTOM_FORM_PRICE,
  HOMEWORK_DAILY_LIMIT,
  HOMEWORK_ITEM_KEYS,
  LOAN_LIMIT,
  SPECIES,
  findCaretaker,
  findForm,
  findSellable,
  specialFormUnlocked,
} from "../items.js";
import { SOUVENIR_SELL_PRICE, findTour, ticketOfferKey } from "../touring.js";
import { DELIVER_MINUTES, findIngredient, findRecipe, nextBotPrice } from "../kitchen.js";
import { schoolMinuteMs } from "../school.js";
import { pet, runtime, widgetStates } from "./state.js";
import { GOV_FEE } from "./constants.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";
import { rescanExtensions } from "./rescanExtensions.js";
import { widgetBox } from "./widgetBox.js";
import { showWidget } from "./showWidget.js";
import { hideWidget } from "./hideWidget.js";
import { autoShowWidgets } from "./autoShowWidgets.js";
import { handleWidgetRequest } from "./handleWidgetRequest.js";
import { processPlan } from "./processPlan.js";
import { canAfford } from "./canAfford.js";
import { applyItemEffects } from "./applyItemEffects.js";
import { activityDef } from "./activityDef.js";
import { isEntryUnlocked } from "./isEntryUnlocked.js";
import { endCurrentActivity } from "./endCurrentActivity.js";
import { processCaretaking } from "./processCaretaking.js";
import { endCaretaking } from "./endCaretaking.js";
import { applyDevCoins } from "./applyDevCoins.js";
import { applyTrayCompact } from "./applyTrayCompact.js";
import { openHub } from "./openHub.js";
import { initFightclub } from "./initFightclub.js";
import { applySleepPause } from "./applySleepPause.js";

/**
 * Subscribe every Tauri event handler and DOM listener of the stats window
 * (in the original wiring order). Call once at startup.
 * Side effects: registers listeners whose handlers mutate pet/runtime,
 * write the DOM, save, and broadcast.
 *
 * @returns {void}
 */
export function initEvents() {
  // ── Bank: deposit/withdraw/borrow/repay ──────────────────────────────────
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

  // Pin/unpin an extension to the quick-launch rows (popover + hub side panel).
  listen("extension-pin", ({ payload }) => {
    const id = payload.id;
    if (!runtime.installedExtensions.some((a) => a.id === id)) return;
    pet.pinnedExtensions = pet.pinnedExtensions.filter((p) => p !== id);
    if (payload.pinned) pet.pinnedExtensions.push(id);
    render();
    save();
    broadcastState();
  });

  listen("extensions-changed", async () => {
    await rescanExtensions();
    for (const box of document.querySelectorAll(".widget-box")) {
      if (!runtime.installedExtensions.some((a) => a.id === box.dataset.extension)) {
        hideWidget(box.dataset.extension);
      }
    }
    autoShowWidgets();
    render();
    save();
    broadcastState();
  });

  listen("extension-widget-set", ({ payload }) => {
    payload.on ? showWidget(payload.id) : hideWidget(payload.id);
  });

  listen("extension-widget-state", ({ payload }) => {
    widgetStates.set(payload.id, payload.state);
    widgetBox(payload.id)
      ?.querySelector("iframe")
      ?.contentWindow?.postMessage({ type: "widget-state", state: payload.state }, "*");
  });

  // Messages FROM widget iframes: bridge requests (answered right here, see
  // handleWidgetRequest.js), a ready handshake (replay the latest state so
  // a freshly loaded widget isn't blank) and button actions for the main page.
  window.addEventListener("message", async (e) => {
    const frame = [...document.querySelectorAll(".widget-box iframe")].find(
      (f) => f.contentWindow === e.source
    );
    if (!frame) return;
    const id = frame.closest(".widget-box").dataset.extension;
    const { reqId, type, payload } = e.data ?? {};
    if (typeof reqId !== "undefined") {
      let result = null;
      let error = null;
      try {
        result = await handleWidgetRequest(type, payload);
      } catch (err) {
        error = String(err?.message ?? err);
      }
      frame.contentWindow.postMessage({ reqId, result, error }, "*");
      return;
    }
    if (type === "widget-ready") {
      const state = widgetStates.get(id);
      if (state !== undefined) {
        frame.contentWindow.postMessage({ type: "widget-state", state }, "*");
      }
    } else if (type === "widget-action") {
      emit("extension-widget-action", { id, payload });
    }
  });

  // One combined trade: sell souvenirs and buy tickets in a single checkout.
  // The net amount may go either way; it only needs to be payable overall.
  listen("pika-checkout", ({ payload }) => {
    const sold = [
      ...new Set(
        (payload.sold ?? []).filter((c) => pet.pika.wants.includes(c) && pet.souvenirs[c] > 0)
      ),
    ];
    const boughtIds = [...new Set(payload.bought ?? [])];
    const bought = pet.pika.sells.filter((o) => boughtIds.includes(o.id));
    // Organic Market groceries ride along in the same checkout.
    const groceries = (payload.ingredients ?? [])
      .map(({ key, qty }) => ({ ing: findIngredient(key), qty: Math.floor(qty) }))
      .filter(({ ing, qty }) => ing && qty > 0 && qty <= 99);
    if (
      (!sold.length && !bought.length && !groceries.length) ||
      bought.length !== boughtIds.length
    ) {
      emit("pika-result", { ok: false, reason: "stale" });
      return;
    }
    const gain = sold.length * SOUVENIR_SELL_PRICE;
    const cost =
      bought.reduce((sum, o) => sum + o.price, 0) +
      groceries.reduce((sum, { ing, qty }) => sum + ing.price * qty, 0);
    if (pet.coins + gain - cost < 0) {
      emit("pika-result", { ok: false, reason: "coins" });
      return;
    }

    for (const city of sold) {
      pet.souvenirs[city] -= 1;
      pet.pika.wants = pet.pika.wants.filter((c) => c !== city); // want fulfilled
    }
    for (const offer of bought) {
      if (offer.kind === "recipe") {
        // A recipe scroll: learn the city dish (no-op if somehow known).
        const key = `dish:${offer.city}`;
        if (!pet.kitchen.recipes.includes(key)) pet.kitchen.recipes.push(key);
        continue;
      }
      // Fighter's Corner stock goes to Darcy's training room.
      if (offer.kind === "book") {
        pet.fightclub.books[offer.item] += 1;
        continue;
      }
      if (offer.kind === "potion") {
        pet.fightclub.potions[offer.item] += 1;
        continue;
      }
      const key = ticketOfferKey(offer);
      pet.tickets[key] = (pet.tickets[key] ?? 0) + 1;
    }
    for (const { ing, qty } of groceries) {
      pet.kitchen.pantry[ing.key] = (pet.kitchen.pantry[ing.key] ?? 0) + qty;
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
    if (pet.caretaking.active || pet.caretaking.plan.length) return; // caretaker owns the schedule
    const def = findTour(payload.key);
    if (!def?.ticket || !(pet.tickets[payload.key] > 0)) return;
    pet.activity.plan.push({ type: "tour", key: payload.key });
    processPlan();
    render();
    save();
    broadcastState();
  });

  // ── Darcy's Fight Club (books, healing, fights — see initFightclub.js) ──
  initFightclub();

  // ── Noonie's Kitchen (see doc/hub.md) ────────────────────────────────────
  // Assign a free paw-bot to cook an open order (consumes the ingredients).
  listen("kitchen-cook", ({ payload }) => {
    const order = pet.kitchen.orders.find((o) => o.id === payload.id);
    const recipe = order && findRecipe(order.recipe);
    if (!recipe || order.status !== "open") return;
    const bot = freeBot();
    if (bot === null) return;
    const pantry = pet.kitchen.pantry;
    const entries = Object.entries(recipe.ingredients);
    if (entries.some(([key, qty]) => (pantry[key] ?? 0) < qty)) return;
    for (const [key, qty] of entries) pantry[key] -= qty;
    order.status = "cooking";
    order.bot = bot;
    order.endsAt = Date.now() + recipe.cookMinutes * schoolMinuteMs(pet.settings.devMode);
    render();
    save();
    broadcastState();
  });

  // Assign a free paw-bot to deliver a cooked order.
  listen("kitchen-deliver", ({ payload }) => {
    const order = pet.kitchen.orders.find((o) => o.id === payload.id);
    if (!order || order.status !== "ready") return;
    const bot = freeBot();
    if (bot === null) return;
    order.status = "delivering";
    order.bot = bot;
    order.endsAt = Date.now() + DELIVER_MINUTES * schoolMinuteMs(pet.settings.devMode);
    render();
    save();
    broadcastState();
  });

  // Unlock the next paw-bot slot (prices rise per slot).
  listen("kitchen-unlock-bot", () => {
    const price = nextBotPrice(pet.kitchen.bots);
    if (price === null || pet.coins < price) return;
    pet.coins -= price;
    pet.kitchen.bots += 1;
    render();
    save();
    broadcastState();
  });

  /** Lowest unlocked bot index not currently on an order, or null. */
  function freeBot() {
    const busy = new Set(pet.kitchen.orders.map((o) => o.bot).filter((b) => b !== null));
    for (let i = 0; i < pet.kitchen.bots; i++) if (!busy.has(i)) return i;
    return null;
  }

  // ── Item use (requested by the hub's Home view) ──────────────────────────
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
    // Toys are playtime — the desktop sprite reacts with a pounce.
    if (ITEM_CATALOG.find((c) => c.items.includes(item))?.key === "toys") {
      emit("pet-react", { kind: "play" });
    }
    render();
    save();
    broadcastState();
  });

  // ── Purchases: cart checkout (requested by the hub's Life view) ──────────
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

  listen("start-plan", ({ payload }) => {
    // Mutual exclusivity: while a caretaker is (or is about to be) on duty,
    // the caretaker owns the schedule — user-started activities are refused.
    if (pet.caretaking.active || pet.caretaking.plan.length) return;
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

  listen("hire-caretakers", ({ payload }) => {
    // Mutual exclusivity: a pet already busy with (or queued for) an activity
    // can't be handed to a caretaker — end the activity first. While a shift is
    // running the activity slot belongs to the caretaker, so queueing follow-up
    // shifts stays allowed.
    if ((pet.activity.active || pet.activity.plan.length) && !pet.caretaking.active) return;
    const keys = (payload.keys ?? []).filter((k) => findCaretaker(k));
    if (!keys.length) return;
    pet.caretaking.plan.push(...keys);
    processCaretaking();
    render();
    save();
    broadcastState();
  });

  listen("end-caretaking", () => endCaretaking());

  // The pet window reports where it was left after each drag.
  listen("pet-moved", ({ payload }) => {
    if (typeof payload.x === "number" && typeof payload.y === "number") {
      pet.window = { x: payload.x, y: payload.y };
      save();
    }
  });

  // ── Government registry (name / call-me changes, for a fee) ──────────────
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
    runtime.saveEnabled = true;
    render();
    save();
    broadcastState();
  });

  // Magic Station: classic forms are bought once at their price, Legendary
  // Cats are claimed free once their condition is met (never purchasable),
  // custom uploads unlock for CUSTOM_FORM_PRICE. Switching owned forms is
  // always free and instant.
  listen("gov-magic", ({ payload }) => {
    const key = payload.species;
    if (typeof key !== "string" || key === pet.species) return;
    const builtin = findForm(key);
    const custom = pet.customForms.find((c) => c.key === key);
    if (!builtin && !custom) return;
    const owned = pet.forms.includes(key);
    let cost = 0;
    if (!owned) {
      if (builtin?.special) {
        if (!specialFormUnlocked(builtin.special, pet)) return; // still locked
      } else {
        cost = builtin ? builtin.price : CUSTOM_FORM_PRICE;
      }
    }
    if (pet.coins < cost) return;
    pet.coins -= cost;
    if (!owned) pet.forms.push(key);
    pet.species = key;
    render();
    save();
    broadcastState();
  });

  // Magic Station "Create My Own Form": the hub copied the spritesheet into
  // <data>/pets/ (import_custom_pet) — register it (still locked until paid).
  listen("custom-form-added", ({ payload }) => {
    const { key, file, name } = payload;
    if (typeof key !== "string" || !key.startsWith("custom-") || typeof file !== "string") return;
    if (pet.customForms.some((c) => c.key === key)) return;
    pet.customForms.push({
      key,
      file,
      breed: (typeof name === "string" && name.trim() ? name.trim() : "Custom Pet").slice(0, 40),
    });
    render();
    save();
    broadcastState();
  });

  // Magic Station "My Own Creations": delete a custom form (confirmed in the
  // hub) — drop it from customForms/forms (no refund if it was unlocked),
  // fall back to the default species if it was active, and remove its file.
  listen("delete-custom-form", ({ payload }) => {
    const key = payload?.key;
    const form = pet.customForms.find((c) => c.key === key);
    if (!form) return;
    pet.customForms = pet.customForms.filter((c) => c.key !== key);
    pet.forms = pet.forms.filter((k) => k !== key);
    if (pet.species === key) pet.species = "toy_poodle";
    invoke("delete_custom_pet", { file: form.file }).catch((e) =>
      console.error("delete_custom_pet failed:", e)
    );
    render();
    save();
    broadcastState();
  });

  // ── Footer buttons + settings persistence ────────────────────────────────
  listen("settings-changed", (event) => {
    pet.settings = { ...pet.settings, ...event.payload };
    setLanguage(pet.settings.language);
    const coinsChanged = applyDevCoins();
    render(); // repaints the popover in the (possibly new) language
    if (coinsChanged) broadcastState();
    save();
  });

  // Rust's wall-clock watcher (main.rs spawn_sleep_watcher) reports how long
  // the computer was asleep; compensate every timer so nothing advances
  // while the lid was closed (Settings → General → pauseOnSleep, default on).
  listen("system-slept", ({ payload }) => applySleepPause(payload));

  // ── Compact (minimized) popover toggle ───────────────────────────────────
  document.getElementById("tray-collapse").addEventListener("click", () => {
    runtime.trayCompact = !runtime.trayCompact;
    try {
      localStorage.setItem("trayCompact", runtime.trayCompact ? "1" : "0");
    } catch {}
    applyTrayCompact();
    render();
  });

  for (const id of [
    "home",
    "shopping",
    "career",
    "touring",
    "achievements",
    "government",
    "pika",
    "fightclub",
    "kitchen",
    "extensions",
    "settings",
  ]) {
    document.getElementById(id).addEventListener("click", () => openHub(id));
  }

  // Compact-mode shortcut row.
  document.getElementById("mini-home").addEventListener("click", () => openHub("home"));
  document.getElementById("mini-extensions").addEventListener("click", () => openHub("extensions"));
  document.getElementById("mini-settings").addEventListener("click", () => openHub("settings"));

  // End/call-back the current activity or caretaker straight from the popover.
  document.getElementById("study-status").addEventListener("click", (e) => {
    if (e.target.id === "stop-activity") endCurrentActivity();
    else if (e.target.id === "stop-caretaking") endCaretaking();
  });

  // Extension buttons open their page in the hub.
  document.getElementById("extension-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-extension]");
    if (btn) openHub(`extension:${btn.dataset.extension}`);
  });

  // A popover shouldn't have its own context menu.
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}
