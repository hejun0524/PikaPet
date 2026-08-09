// hub/renderGrid.js — Grid: renders the main content area for the current
// view and active tab.

import { convertFileSrc } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import {
  ITEM_CATALOG,
  HOMEWORK_DAILY_LIMIT,
  SHOP_CATALOG,
  addonList,
  findSellable,
} from "../items.js";
import { adventurePageHTML } from "../adventure.js";
import { arenaPageHTML } from "../arena.js";
import { escText as esc } from "../panel.js";
import { addonFrame } from "./addonFrame.js";
import { homeCardHTML } from "./homeCardHTML.js";
import { shopCardHTML } from "./shopCardHTML.js";
import { souvenirsPageHTML } from "./souvenirsPageHTML.js";
import { ticketsPageHTML } from "./ticketsPageHTML.js";
import { schoolPageHTML } from "./schoolPageHTML.js";
import { jobPageHTML } from "./jobPageHTML.js";
import { journalsPageHTML } from "./journalsPageHTML.js";
import { sportsPageHTML } from "./sportsPageHTML.js";
import { destinationsPageHTML } from "./destinationsPageHTML.js";
import { achievementWallHTML } from "./achievementWallHTML.js";
import { caretakersHTML } from "./caretakersHTML.js";
import { magicStationHTML } from "./magicStationHTML.js";
import { bankHTML } from "./bankHTML.js";
import { registryHTML } from "./registryHTML.js";
import { refreshGovApply } from "./refreshGovApply.js";
import { pikaSellPageHTML } from "./pikaSellPageHTML.js";
import { pikaBuyPageHTML } from "./pikaBuyPageHTML.js";
import { settingsHTML } from "./settingsHTML.js";
import { refreshHidePet } from "./refreshHidePet.js";
import { refreshAutostart } from "./refreshAutostart.js";

/**
 * Render the main grid for the current view (`ui.view`) and its active tab:
 * Home item cards, the shop, career pages, touring pages, achievements, the
 * adventure world, add-on tiles/iframes, Pet Center pages, Pika's trading
 * post, and Settings.
 *
 * Side effects: rewrites #grid, toggles #grid/#addon-host visibility, may
 * create add-on iframes inside #addon-host, and kicks off the async
 * hide-pet/autostart checkbox refreshes on the Settings page.
 *
 * @returns {void}
 */
export function renderGrid() {
  const grid = document.getElementById("grid");

  // Add-on iframes live OUTSIDE the grid in #addon-host so they survive view
  // switches (music keeps playing while you browse other pages). Grid and
  // host are flex siblings, so exactly one of them must be hidden at a time
  // or they split the panel — do it up here because most views return early
  // below. (The add-on branch un-hides the grid again for its error notes.)
  const host = document.getElementById("addon-host");
  host.hidden = !ui.view.startsWith("addon:");
  grid.hidden = ui.view.startsWith("addon:");

  if (ui.view === "home") {
    if (ui.homeTab === "souvenirs") {
      grid.innerHTML = souvenirsPageHTML();
      return;
    }
    if (ui.homeTab === "tickets") {
      grid.innerHTML = ticketsPageHTML();
      return;
    }
    const category = ITEM_CATALOG.find((c) => c.key === ui.homeTab);
    const stocked = category.items.filter((item) => state.bag[item.key] > 0);
    let note = "";
    let exhausted = false;
    if (ui.homeTab === "homework") {
      const today = new Date().toISOString().slice(0, 10);
      const used = state.homework?.date === today ? state.homework.count : 0;
      const left = Math.max(0, HOMEWORK_DAILY_LIMIT - used);
      exhausted = left === 0;
      note = `<div class="ach-section caretaker-title">${t("home.homeworkLeft", {
        left,
        max: HOMEWORK_DAILY_LIMIT,
      })}${exhausted ? t("home.homeworkDone") : ""}</div>`;
    }
    grid.innerHTML =
      note +
      (stocked.length
        ? stocked.map((item) => homeCardHTML(item, exhausted)).join("")
        : `<div class="empty-note">${t("home.empty")}</div>`);
    return;
  }

  if (ui.view === "shopping") {
    const store = SHOP_CATALOG.find((c) => c.key === ui.shopTab);
    grid.innerHTML = store.sells.map((key) => shopCardHTML(findSellable(key))).join("");
    return;
  }

  if (ui.view === "career") {
    if (ui.careerTab === "school") {
      grid.innerHTML = schoolPageHTML();
    } else {
      grid.innerHTML = jobPageHTML();
    }
    return;
  }

  if (ui.view === "touring") {
    grid.innerHTML =
      ui.touringTab === "journals"
        ? journalsPageHTML()
        : ui.touringTab === "sports"
          ? sportsPageHTML()
          : destinationsPageHTML();
    return;
  }

  if (ui.view === "achievements") {
    grid.innerHTML = achievementWallHTML();
    return;
  }

  // Adventure: the pet's own game world — a function of the app (not an
  // add-on), but a fully separate ecosystem (Paw Tokens ≠ coins, recruit
  // levels ≠ traits) with its own save. Lives in adventure.js; it reads only
  // the pet's name. Design doc: doc/adventure.md.
  if (ui.view === "adventure") {
    grid.innerHTML = adventurePageHTML(state.name);
    return;
  }

  // Arena: 大乐斗-style async pet fights. Fight cards derive from the real
  // pet (traits + care), so it's a hub view, not an add-on. Battle engine
  // pending — see arena.js.
  if (ui.view === "arena") {
    grid.innerHTML = arenaPageHTML(state);
    return;
  }

  // Add-ons homepage: an iPhone-style springboard of app tiles. The 🧰
  // manager (top right) installs/uninstalls.
  if (ui.view === "addons") {
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
      : `<div class="empty-note">${t("addons.empty")}</div>`;
    return;
  }

  if (ui.view === "government") {
    if (ui.petcenterTab === "caretakers") grid.innerHTML = caretakersHTML();
    else if (ui.petcenterTab === "magic") grid.innerHTML = magicStationHTML();
    else if (ui.petcenterTab === "bank") grid.innerHTML = bankHTML();
    else {
      grid.innerHTML = registryHTML();
      refreshGovApply();
    }
    return;
  }

  // One live iframe per opened add-on: switching between add-ons hides the
  // others instead of destroying them, so several can keep running at once
  // (music playing while another add-on's page stays active).
  if (ui.view.startsWith("addon:")) {
    const id = ui.view.slice(6);
    const addon = state.addonsInstalled.find((a) => a.id === id);
    grid.innerHTML = "";
    if (!addon) {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">${t("addons.notInstalled")}</div>`;
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
      // Keyboard-driven add-ons (piano, games) need key events to land inside
      // their iframe document, which only happens once the frame has focus.
      frame.focus();
    } else {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">${t("addons.noPage", { name: esc(addon.name ?? id) })}</div>`;
    }
    return;
  }

  if (ui.view === "pika") {
    grid.innerHTML = ui.pikaTab === "buy" ? pikaBuyPageHTML() : pikaSellPageHTML();
    return;
  }

  if (ui.view === "settings") {
    grid.innerHTML = settingsHTML();
    refreshHidePet();
    refreshAutostart();
  }
}
