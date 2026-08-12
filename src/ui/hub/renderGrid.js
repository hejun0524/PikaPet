// hub/renderGrid.js — Grid: renders the main content area for the current
// view and active tab.

import { convertFileSrc } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import {
  ITEM_CATALOG,
  HOMEWORK_DAILY_LIMIT,
  SHOP_CATALOG,
  extensionList,
  findSellable,
} from "../items.js";
import { escText as esc } from "../panel.js";
import { extensionFrame } from "./extensionFrame.js";
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
import { pikaMarketPageHTML } from "./pikaMarketPageHTML.js";
import { pikaGymPageHTML } from "./pikaGymPageHTML.js";
import { kitchenOrdersHTML } from "./kitchenOrdersHTML.js";
import { kitchenRecipesHTML } from "./kitchenRecipesHTML.js";
import { kitchenPantryHTML } from "./kitchenPantryHTML.js";
import { kitchenBotsHTML } from "./kitchenBotsHTML.js";
import { extensionManagerHTML } from "./extensionManagerHTML.js";
import { loadMarketplace, marketplaceHTML } from "./marketplace.js";
import { fightclubClubHTML } from "./fightclubClubHTML.js";
import { fightclubSkillsHTML } from "./fightclubSkillsHTML.js";
import { fightclubTrainHTML } from "./fightclubTrainHTML.js";
import { fightclubBattleHTML } from "./fightclubBattleHTML.js";
import { settingsHTML } from "./settingsHTML.js";
import { refreshHidePet } from "./refreshHidePet.js";
import { refreshAutostart } from "./refreshAutostart.js";

/**
 * Render the main grid for the current view (`ui.view`) and its active tab:
 * Home item cards, the shop, career pages, touring pages, achievements, the
 * coming-soon cat pages (Fight Club, Delivery), extension tiles/iframes, Pet
 * Center pages, Pika's Trading Post, and Settings.
 *
 * Side effects: rewrites #grid, toggles #grid/#extension-host visibility, may
 * create extension iframes inside #extension-host, and kicks off the async
 * hide-pet/autostart checkbox refreshes on the Settings page.
 *
 * @returns {void}
 */
export function renderGrid() {
  const grid = document.getElementById("grid");

  // Extension iframes live OUTSIDE the grid in #extension-host so they survive view
  // switches (music keeps playing while you browse other pages). Grid and
  // host are flex siblings, so exactly one of them must be hidden at a time
  // or they split the panel — do it up here because most views return early
  // below. (The extension branch un-hides the grid again for its error notes.)
  const host = document.getElementById("extension-host");
  host.hidden = !ui.view.startsWith("extension:");
  grid.hidden = ui.view.startsWith("extension:");

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

  // Darcy's Fight Club: the challenger board (or a running battle replay),
  // the 50-skill wall, and the Training Room (Skill Books + healing).
  if (ui.view === "fightclub") {
    grid.innerHTML =
      ui.fightclubTab === "skills"
        ? fightclubSkillsHTML()
        : ui.fightclubTab === "train"
          ? fightclubTrainHTML()
          : ui.battle
            ? fightclubBattleHTML()
            : fightclubClubHTML();
    return;
  }

  // Noonie's Kitchen: order board, recipe scrolls, pantry, paw-bots.
  if (ui.view === "kitchen") {
    grid.innerHTML =
      ui.kitchenTab === "recipes"
        ? kitchenRecipesHTML()
        : ui.kitchenTab === "pantry"
          ? kitchenPantryHTML()
          : ui.kitchenTab === "bots"
            ? kitchenBotsHTML()
            : kitchenOrdersHTML();
    return;
  }

  // Extensions: springboard of installed extensions (My Extensions), the
  // GitHub-release Marketplace, and the Manager tab (pin/uninstall/zip).
  if (ui.view === "addons") {
    if (ui.extensionsTab === "manager") {
      grid.innerHTML = extensionManagerHTML();
      return;
    }
    if (ui.extensionsTab === "market") {
      loadMarketplace();
      grid.innerHTML = marketplaceHTML();
      return;
    }
    const extensions = extensionList(state.extensionsInstalled);
    grid.innerHTML = extensions.length
      ? `<div class="app-grid">${extensions
          .map(
            (a) => `
        <button class="app-tile" data-open-extension="${esc(a.id)}">
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

  // One live iframe per opened extension: switching between extensions hides the
  // others instead of destroying them, so several can keep running at once
  // (music playing while another extension's page stays active).
  if (ui.view.startsWith("extension:")) {
    const id = ui.view.slice("extension:".length);
    const extension = state.extensionsInstalled.find((a) => a.id === id);
    grid.innerHTML = "";
    if (!extension) {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">${t("addons.notInstalled")}</div>`;
    } else if (extension.entry && extension.dir) {
      let frame = extensionFrame(id);
      if (!frame) {
        frame = document.createElement("iframe");
        frame.className = "extension-frame";
        frame.dataset.extension = id;
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
        frame.src = convertFileSrc(`${extension.dir}/${extension.entry}`);
        host.appendChild(frame);
      }
      for (const f of host.querySelectorAll("iframe")) {
        f.classList.toggle("bg", f !== frame);
      }
      // Keyboard-driven extensions (piano, games) need key events to land inside
      // their iframe document, which only happens once the frame has focus.
      frame.focus();
    } else {
      host.hidden = true;
      grid.hidden = false;
      grid.innerHTML = `<div class="empty-note">${t("addons.noPage", { name: esc(extension.name ?? id) })}</div>`;
    }
    return;
  }

  if (ui.view === "pika") {
    grid.innerHTML =
      ui.pikaTab === "buy"
        ? pikaBuyPageHTML()
        : ui.pikaTab === "market"
          ? pikaMarketPageHTML()
          : ui.pikaTab === "gym"
            ? pikaGymPageHTML()
            : pikaSellPageHTML();
    return;
  }

  if (ui.view === "settings") {
    grid.innerHTML = settingsHTML();
    refreshHidePet();
    refreshAutostart();
  }
}
