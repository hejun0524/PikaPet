// hub/initEvents.js — Events: all the hub window's delegated DOM listeners
// (side panel, top-bar basket buttons, drawers, tabs, grid) plus the drawer
// checkout result listeners ("pika-result", "cart-result").

import {
  invoke,
  emit,
  listen,
  WebviewWindow,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
} from "../shared/tauri.js";
import { t, setLanguage, getLocale } from "../shared/i18n.js";
import { state, ui, cart, tradeSell, tradeBuy, tradeIng, baskets, appSettings } from "./state.js";
import { findForm } from "../items.js";
import { findIngredient } from "../kitchen.js";
import { renderAll } from "./renderAll.js";
import { findSellable, findCaretaker } from "../items.js";
import { findClass } from "../school.js";
import { findJob } from "../career.js";
import { setView } from "./setView.js";
import { flyEmoji } from "./flyEmoji.js";
import { renderTopbar } from "./renderTopbar.js";
import { renderTabs } from "./renderTabs.js";
import { renderGrid } from "./renderGrid.js";
import { renderCartBadge } from "./renderCartBadge.js";
import { renderPlanBadge } from "./renderPlanBadge.js";
import { renderTradeBadge } from "./renderTradeBadge.js";
import { renderServiceBadge } from "./renderServiceBadge.js";
import { installExtensionFlow } from "./installExtensionFlow.js";
import { uninstallExtensionFlow } from "./uninstallExtensionFlow.js";
import { promptMarketInstall, confirmMarketInstall, cancelMarketInstall } from "./marketInstallFlow.js";
import { loadMarketplace } from "./marketplace.js";
import { applySideCollapsed } from "./applySideCollapsed.js";
import { refreshGovApply } from "./refreshGovApply.js";
import { CHOICE_BOOKS } from "../fightclub.js";
import { startFightReplay, skipFightReplay } from "./fightReplay.js";

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

  // Collapse the side panel into an icon-only rail (persisted).
  document.getElementById("side-collapse").addEventListener("click", () => {
    // Keep the CONTENT panel fixed on screen: the window's LEFT edge moves
    // by the rail delta while the right edge stays put, so visually the
    // side panel shrinks/grows into place and the pages never shift.
    const content = document.getElementById("content");
    const before = content.offsetWidth;
    const collapsed = document.getElementById("layout").classList.toggle("collapsed");
    try {
      localStorage.setItem("sideCollapsed", collapsed ? "1" : "0");
    } catch {}
    applySideCollapsed();
    const delta = content.offsetWidth - before; // reflow happened above
    if (delta === 0) return;
    (async () => {
      try {
        const win = getCurrentWindow();
        const [pos, scale] = await Promise.all([win.outerPosition(), win.scaleFactor()]);
        await Promise.all([
          win.setPosition(new PhysicalPosition(pos.x + Math.round(delta * scale), pos.y)),
          win.setSize(new LogicalSize(window.innerWidth - delta, window.innerHeight)),
        ]);
      } catch (err) {
        console.error("collapse resize failed:", err);
      }
    })();
  });

  document.getElementById("side-extensions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-extension]");
    if (btn) setView(`extension:${btn.dataset.extension}`);
  });

  // The basket buttons now navigate to a full checkout page (setView.js
  // remembers ui.returnView) instead of toggling a dropdown drawer.
  document.getElementById("cart-btn").addEventListener("click", () => setView("cart"));
  document.getElementById("plan-btn").addEventListener("click", () => setView("plan"));
  document.getElementById("trade-btn").addEventListener("click", () => setView("trade"));
  document.getElementById("service-btn").addEventListener("click", () => setView("service"));
  document.getElementById("back-btn").addEventListener("click", () => setView(ui.returnView ?? "home"));
  document.getElementById("extension-install-btn").addEventListener("click", () => installExtensionFlow());
  document.getElementById("market-refresh-btn").addEventListener("click", () => loadMarketplace(true));

  // Back to the Extensions homepage from an open extension page. The iframe
  // stays alive in #extension-host, so this doesn't interrupt whatever it's doing.
  document.getElementById("extensions-home-btn").addEventListener("click", () => setView("extensions"));

  listen("pika-result", ({ payload }) => {
    if (payload.ok) {
      tradeSell.clear();
      tradeBuy.clear();
      tradeIng.clear();
      renderTradeBadge();
      setView(ui.returnView ?? "pika");
    } else {
      // Stale offers (store refreshed) — drop anything no longer on sale.
      const liveIds = new Set((state.pika.sells ?? []).map((o) => o.id));
      for (const id of [...tradeBuy.keys()]) if (!liveIds.has(id)) tradeBuy.delete(id);
      renderTradeBadge();
      renderGrid();
    }
  });

  listen("cart-result", ({ payload }) => {
    if (payload.ok) {
      cart.clear();
      renderCartBadge();
      setView(ui.returnView ?? "shopping");
    } else {
      renderGrid();
    }
  });

  // A fight was simulated by the stats window — replay it line by line.
  listen("fight-result", ({ payload }) => {
    ui.battle = { ...payload, idx: 0, done: false };
    if (ui.view === "fightclub") {
      ui.fightclubTab = "club";
      renderTabs();
      renderGrid();
    }
    startFightReplay();
  });

  // Book/heal actions answer here; the Training Room shows the message.
  listen("fightclub-result", ({ payload }) => {
    ui.trainMsg = payload;
    ui.pickerBook = null;
    if (ui.view === "fightclub") renderGrid();
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
    else if (ui.view === "kitchen") ui.kitchenTab = tab.dataset.tab;
    else if (ui.view === "fightclub") ui.fightclubTab = tab.dataset.tab;
    else if (ui.view === "extensions") ui.extensionsTab = tab.dataset.tab;
    else if (ui.view === "government") {
      ui.petcenterTab = tab.dataset.tab;
      ui.pendingMagic = null;
      ui.createPending = false;
    }
    // The Extensions view's Manager/Marketplace tabs each show their own
    // topbar button (install-from-zip, refresh) — switching tabs alone
    // (not the whole view) needs to update that visibility too.
    renderTopbar();
    renderTabs();
    renderGrid();
  });

  document.getElementById("grid").addEventListener("click", (e) => {
    const appTile = e.target.closest("[data-open-extension]");
    if (appTile) {
      setView(`extension:${appTile.dataset.openExtension}`);
      return;
    }

    // ── Extensions: Manager tab + Marketplace tab ───────────────────────
    // (install-from-zip and marketplace-refresh are topbar buttons now —
    // see the direct listeners above.)
    const pinBtn = e.target.closest("[data-pin]");
    if (pinBtn) {
      emit("extension-pin", { id: pinBtn.dataset.pin, pinned: !state.pinnedExtensions.includes(pinBtn.dataset.pin) });
      return;
    }
    const uninstallBtn = e.target.closest("[data-uninstall]");
    if (uninstallBtn) {
      uninstallExtensionFlow(uninstallBtn.dataset.uninstall);
      return;
    }
    const marketBtn = e.target.closest("[data-market-install]");
    if (marketBtn) {
      promptMarketInstall(marketBtn.dataset.marketInstall);
      return;
    }
    if (e.target.id === "market-perm-confirm") {
      confirmMarketInstall();
      return;
    }
    if (e.target.id === "market-perm-cancel") {
      cancelMarketInstall();
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
      return;
    }

    const classCard = e.target.closest("[data-plan-class]");
    if (classCard) {
      const cls = findClass(classCard.dataset.planClass);
      flyEmoji(cls.emoji, classCard, document.getElementById("plan-btn"));
      baskets.planBook.push({ type: "class", key: cls.key });
      renderPlanBadge();
      return;
    }

    const jobCard = e.target.closest("[data-plan-job]");
    if (jobCard) {
      const job = findJob(jobCard.dataset.planJob);
      flyEmoji(job.emoji, jobCard, document.getElementById("plan-btn"));
      baskets.planBook.push({ type: "job", key: job.key });
      renderPlanBadge();
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
      renderGrid();
      return;
    }

    // Pika's Organic Market: stage one unit in the 🤝 trade basket.
    const ingCard = e.target.closest("[data-trade-ing]");
    if (ingCard) {
      const key = ingCard.dataset.tradeIng;
      flyEmoji(findIngredient(key).emoji, ingCard, document.getElementById("trade-btn"));
      tradeIng.set(key, (tradeIng.get(key) ?? 0) + 1);
      renderTradeBadge();
      renderGrid();
      return;
    }
    const cookBtn = e.target.closest("[data-cook]");
    if (cookBtn) {
      emit("kitchen-cook", { id: cookBtn.dataset.cook });
      return;
    }
    const deliverBtn = e.target.closest("[data-deliver]");
    if (deliverBtn) {
      emit("kitchen-deliver", { id: deliverBtn.dataset.deliver });
      return;
    }

    // Dune's Daily Tasks: claim a completed task's reward.
    const claimBtn = e.target.closest("[data-claim-task]");
    if (claimBtn) {
      emit("dune-claim", { index: Number(claimBtn.dataset.claimTask) });
      return;
    }
    if (e.target.id === "unlock-bot") {
      emit("kitchen-unlock-bot", {});
      return;
    }

    // ── Darcy's Fight Club ──────────────────────────────────────────────
    const betChip = e.target.closest("[data-bet]");
    if (betChip) {
      ui.fightBet = Number(betChip.dataset.bet);
      renderGrid();
      return;
    }
    const fightBtn = e.target.closest("[data-fight]");
    if (fightBtn) {
      emit("fightclub-fight", { opponent: fightBtn.dataset.fight, bet: ui.fightBet });
      return;
    }
    const bookBtn = e.target.closest("[data-use-book]");
    if (bookBtn) {
      const key = bookBtn.dataset.useBook;
      if (CHOICE_BOOKS.has(key)) {
        // Wild/master books first open the skill picker.
        ui.pickerBook = key;
        ui.trainMsg = null;
        renderGrid();
      } else {
        emit("fightclub-use-book", { book: key });
      }
      return;
    }
    const pickBtn = e.target.closest("[data-pick-skill]");
    if (pickBtn) {
      emit("fightclub-use-book", { book: ui.pickerBook, skill: pickBtn.dataset.pickSkill });
      return;
    }
    if (e.target.id === "picker-cancel") {
      ui.pickerBook = null;
      renderGrid();
      return;
    }
    const potionBtn = e.target.closest("[data-use-potion]");
    if (potionBtn) {
      emit("fightclub-use-potion", { key: potionBtn.dataset.usePotion });
      return;
    }
    if (e.target.id === "fight-skip") {
      skipFightReplay();
      return;
    }
    if (e.target.id === "fight-back") {
      ui.battle = null;
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
      renderGrid();
      return;
    }

    // Magic Station: delete a custom creation (confirmed — see magic-cancel/
    // delete-form-confirm below). Checked before data-magic so the delete
    // icon never also triggers the card's own click.
    const deleteFormBtn = e.target.closest("[data-delete-form]");
    if (deleteFormBtn) {
      ui.deleteFormPending = deleteFormBtn.dataset.deleteForm;
      ui.magicMsg = "";
      renderGrid();
      return;
    }
    if (e.target.id === "delete-form-cancel") {
      ui.deleteFormPending = null;
      renderGrid();
      return;
    }
    if (e.target.id === "delete-form-confirm") {
      emit("delete-custom-form", { key: ui.deleteFormPending });
      ui.deleteFormPending = null;
      renderGrid();
      return;
    }

    const magicCard = e.target.closest("[data-magic]");
    if (magicCard) {
      const key = magicCard.dataset.magic;
      if (state.forms.includes(key) || findForm(key)?.special) {
        // Owned forms switch instantly; earned Legendary Cats claim free
        // (their card is only clickable once the condition is met).
        emit("gov-magic", { species: key });
      } else {
        ui.pendingMagic = key; // purchases ask for confirmation first
        renderGrid();
      }
      return;
    }
    // Magic Station: create a custom form — first name the breed, then pick
    // the spritesheet file.
    if (e.target.closest("#create-form")) {
      ui.createPending = true;
      ui.magicMsg = "";
      renderGrid();
      return;
    }
    if (e.target.id === "create-cancel") {
      ui.createPending = false;
      renderGrid();
      return;
    }
    if (e.target.id === "create-continue") {
      const typed = document.getElementById("create-name").value.trim();
      (async () => {
        try {
          const path = await invoke("plugin:dialog|open", {
            options: {
              title: t("magic.pickSheet"),
              filters: [{ name: "Spritesheet", extensions: ["webp", "png"] }],
              multiple: false,
              directory: false,
            },
          });
          if (!path) return;
          const form = await invoke("import_custom_pet", { path });
          ui.magicMsg = "";
          ui.createPending = false;
          // The typed breed name wins; the file stem is only the fallback.
          emit("custom-form-added", { ...form, name: typed || form.name });
        } catch (err) {
          ui.magicMsg = t("magic.importFailed", { err });
          ui.createPending = false;
          renderGrid();
        }
      })();
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

    // Settings → Storage: reveal the data folder in Finder.
    if (e.target.id === "storage-open") {
      invoke("open_data_folder").catch((err) => {
        ui.storageMsg = t("settings.storageFailed", { err });
        renderGrid();
      });
      return;
    }

    // Settings → Storage: pick a new data folder; Rust validates, migrates,
    // and restarts the app. Errors come back here and render inline.
    if (e.target.id === "storage-change") {
      (async () => {
        try {
          const path = await invoke("plugin:dialog|open", {
            options: { title: t("settings.storagePick"), directory: true, multiple: false },
          });
          if (!path) return;
          await invoke("change_data_dir", { path });
        } catch (err) {
          ui.storageMsg = t("settings.storageFailed", { err });
          renderGrid();
        }
      })();
      return;
    }

    // ── Basket pages: cart / plan / trade / service ─────────────────────
    const cartRemove = e.target.closest("[data-remove]");
    if (cartRemove) {
      cart.delete(cartRemove.dataset.remove);
      renderCartBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "cart-clear") {
      cart.clear();
      renderCartBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "cart-checkout") {
      emit("buy-cart", { items: [...cart].map(([key, qty]) => ({ key, qty })) });
      return;
    }

    const planRemove = e.target.closest("[data-plan-remove]");
    if (planRemove) {
      baskets.planBook.splice(Number(planRemove.dataset.planRemove), 1);
      renderPlanBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "plan-clear") {
      baskets.planBook = [];
      renderPlanBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "plan-start") {
      if (baskets.planBook.length) {
        emit("start-plan", { entries: [...baskets.planBook] });
        baskets.planBook = [];
        renderPlanBadge();
        setView(ui.returnView ?? "career");
      }
      return;
    }

    const tradeRemoveSell = e.target.closest("[data-trade-remove-sell]");
    if (tradeRemoveSell) {
      tradeSell.delete(tradeRemoveSell.dataset.tradeRemoveSell);
      renderTradeBadge();
      renderGrid();
      return;
    }
    const tradeRemoveBuy = e.target.closest("[data-trade-remove-buy]");
    if (tradeRemoveBuy) {
      tradeBuy.delete(tradeRemoveBuy.dataset.tradeRemoveBuy);
      renderTradeBadge();
      renderGrid();
      return;
    }
    const tradeRemoveIng = e.target.closest("[data-trade-remove-ing]");
    if (tradeRemoveIng) {
      tradeIng.delete(tradeRemoveIng.dataset.tradeRemoveIng);
      renderTradeBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "trade-clear") {
      tradeSell.clear();
      tradeBuy.clear();
      tradeIng.clear();
      renderTradeBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "trade-checkout") {
      emit("pika-checkout", {
        sold: [...tradeSell],
        bought: [...tradeBuy.keys()],
        ingredients: [...tradeIng].map(([key, qty]) => ({ key, qty })),
      });
      return;
    }

    const serviceRemove = e.target.closest("[data-service-remove]");
    if (serviceRemove) {
      baskets.serviceCart.splice(Number(serviceRemove.dataset.serviceRemove), 1);
      renderServiceBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "service-clear") {
      baskets.serviceCart = [];
      renderServiceBadge();
      renderGrid();
      return;
    }
    if (e.target.id === "service-hire") {
      if (baskets.serviceCart.length) {
        emit("hire-caretakers", { keys: [...baskets.serviceCart] });
        baskets.serviceCart = [];
        renderServiceBadge();
        setView(ui.returnView ?? "government");
      }
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
    } else if (e.target.id === "pause-on-sleep") {
      appSettings.pauseOnSleep = e.target.checked;
      emit("settings-changed", { ...appSettings });
    } else if (e.target.id === "language") {
      appSettings.language = e.target.value;
      setLanguage(appSettings.language);
      emit("settings-changed", { ...appSettings });
      invoke("set_current_locale", { locale: getLocale() }).catch(() => {});
      // Live extension pages get told too, so they can re-render themselves.
      for (const id of ui.openExtensionIds) {
        invoke("ext_push", { id, kind: "app-locale", data: { locale: getLocale() } }).catch(() => {});
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
