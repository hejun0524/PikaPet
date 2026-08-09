// hub/initEvents.js — Events: all the hub window's delegated DOM listeners
// (side panel, top-bar basket buttons, drawers, tabs, grid) plus the drawer
// checkout result listeners ("pika-result", "cart-result").

import { invoke, emit, listen, WebviewWindow } from "../shared/tauri.js";
import { setLanguage, getLocale } from "../shared/i18n.js";
import { state, ui, cart, tradeSell, tradeBuy, baskets, appSettings } from "./state.js";
import { renderAll } from "./renderAll.js";
import { findSellable, findCaretaker } from "../items.js";
import { findClass } from "../school.js";
import { findJob } from "../career.js";
import { advUi, advHandleClick } from "../adventure.js";
import { arenaHandleClick } from "../arena.js";
import { setView } from "./setView.js";
import { flyEmoji } from "./flyEmoji.js";
import { renderTabs } from "./renderTabs.js";
import { renderGrid } from "./renderGrid.js";
import { renderCartBadge } from "./renderCartBadge.js";
import { renderCartDrawer } from "./renderCartDrawer.js";
import { renderPlanBadge } from "./renderPlanBadge.js";
import { renderPlanDrawer } from "./renderPlanDrawer.js";
import { renderTradeBadge } from "./renderTradeBadge.js";
import { renderTradeDrawer } from "./renderTradeDrawer.js";
import { renderServiceBadge } from "./renderServiceBadge.js";
import { renderServiceDrawer } from "./renderServiceDrawer.js";
import { renderAddonDrawer } from "./renderAddonDrawer.js";
import { installAddonFlow } from "./installAddonFlow.js";
import { uninstallAddonFlow } from "./uninstallAddonFlow.js";
import { refreshGovApply } from "./refreshGovApply.js";

/**
 * Wire every DOM event listener of the hub window, in the original source
 * order: side-panel navigation and stop buttons, the basket/drawer toggle
 * buttons, the five drawers' click handling (with the "pika-result" and
 * "cart-result" Tauri listeners next to their drawers), the tab strip, and
 * the grid's delegated click/input/change handlers.
 *
 * Side effects: registers DOM and Tauri event listeners whose handlers
 * mutate ui/cart/basket state, emit app events, and re-render.
 *
 * @returns {void}
 */
export function initEvents() {
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
      baskets.serviceCart.splice(Number(remove.dataset.serviceRemove), 1);
      renderServiceBadge();
      renderServiceDrawer();
      renderGrid();
      return;
    }
    if (e.target.id === "service-clear") {
      baskets.serviceCart = [];
      renderServiceBadge();
      renderServiceDrawer();
      renderGrid();
      return;
    }
    if (e.target.id === "service-hire") {
      if (baskets.serviceCart.length) {
        emit("hire-caretakers", { keys: [...baskets.serviceCart] });
        baskets.serviceCart = [];
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
      baskets.planBook.splice(Number(remove.dataset.planRemove), 1);
      renderPlanBadge();
      renderPlanDrawer();
      return;
    }
    if (e.target.id === "plan-clear") {
      baskets.planBook = [];
      renderPlanBadge();
      renderPlanDrawer();
      return;
    }
    if (e.target.id === "plan-start") {
      if (baskets.planBook.length) {
        emit("start-plan", { entries: [...baskets.planBook] });
        baskets.planBook = [];
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
    if (ui.view === "home") ui.homeTab = tab.dataset.tab;
    else if (ui.view === "shopping") ui.shopTab = tab.dataset.tab;
    else if (ui.view === "career") ui.careerTab = tab.dataset.tab;
    else if (ui.view === "touring") ui.touringTab = tab.dataset.tab;
    else if (ui.view === "achievements") ui.achTab = tab.dataset.tab;
    else if (ui.view === "pika") ui.pikaTab = tab.dataset.tab;
    else if (ui.view === "adventure") advUi.tab = tab.dataset.tab;
    else if (ui.view === "government") {
      ui.petcenterTab = tab.dataset.tab;
      ui.pendingMagic = null;
    }
    renderTabs();
    renderGrid();
  });

  document.getElementById("grid").addEventListener("click", (e) => {
    // The adventure world handles its own clicks (adventure.js) and just needs
    // a repaint afterwards.
    if (ui.view === "adventure") {
      if (advHandleClick(e)) renderGrid();
      return;
    }

    // Same pattern for the Arena (arena.js).
    if (ui.view === "arena") {
      if (arenaHandleClick(e, state)) renderGrid();
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
      baskets.planBook.push({ type: "class", key: cls.key });
      renderPlanBadge();
      renderPlanDrawer();
      return;
    }

    const jobCard = e.target.closest("[data-plan-job]");
    if (jobCard) {
      const job = findJob(jobCard.dataset.planJob);
      flyEmoji(job.emoji, jobCard, document.getElementById("plan-btn"));
      baskets.planBook.push({ type: "job", key: job.key });
      renderPlanBadge();
      renderPlanDrawer();
      return;
    }

    const careerChip = e.target.closest("[data-career]");
    if (careerChip) {
      ui.jobCareer = careerChip.dataset.career;
      renderGrid();
      return;
    }

    const subjectChip = e.target.closest("[data-subject]");
    if (subjectChip) {
      ui.schoolSubject = subjectChip.dataset.subject;
      renderGrid();
      return;
    }

    const destChip = e.target.closest("[data-dest]");
    if (destChip) {
      ui.tourDest = destChip.dataset.dest;
      renderGrid();
      return;
    }

    const leagueChip = e.target.closest("[data-league]");
    if (leagueChip) {
      ui.sportLeague = leagueChip.dataset.league;
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
      baskets.serviceCart.push(key);
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
        ui.pendingMagic = key; // purchases ask for confirmation first
        renderGrid();
      }
      return;
    }
    if (e.target.id === "magic-confirm") {
      emit("gov-magic", { species: ui.pendingMagic });
      ui.pendingMagic = null;
      renderGrid();
      return;
    }
    if (e.target.id === "magic-cancel") {
      ui.pendingMagic = null;
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
        ui.resetPending = true;
        renderGrid();
        break;
      case "reset-cancel":
        ui.resetPending = false;
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
    } else if (e.target.id === "dev-coins") {
      appSettings.devCoins = e.target.checked;
      emit("settings-changed", { ...appSettings });
    } else if (e.target.id === "language") {
      appSettings.language = e.target.value;
      setLanguage(appSettings.language);
      emit("settings-changed", { ...appSettings });
      // Live add-on pages get told too, so they can re-render themselves.
      for (const frame of document.querySelectorAll("#addon-host iframe")) {
        frame.contentWindow?.postMessage({ type: "app-locale", locale: getLocale() }, "*");
      }
      renderAll();
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
}
