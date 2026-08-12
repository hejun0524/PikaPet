// main/initEvents.js — all event wiring of the pet window: live settings
// changes, "pet-state" broadcasts from the stats window, extension "pet-say"
// requests, reaction one-shots ("fight-result" wins, "pet-react" toy play,
// shy on rename/caretaker hire), left-drag / manual double-click on the
// sprite, drag-direction feedback from window move events, and the
// right-click native menu.

import { listen, emit } from "../shared/tauri.js";
import { setLanguage } from "../shared/i18n.js";
import { petEl, appWindow, latest, trip, rt, DOUBLE_CLICK_MS } from "./state.js";
import { applySettings } from "./applySettings.js";
import { updateResting } from "./updateResting.js";
import { applySpecies } from "./applySpecies.js";
import { departForTrip } from "./departForTrip.js";
import { returnFromTrip } from "./returnFromTrip.js";
import { maybeComplain } from "./maybeComplain.js";
import { say } from "./say.js";
import { openHub } from "./openHub.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";
import { playOnce } from "./playOnce.js";
import { clampToScreen } from "./clampToScreen.js";
import { buildMenu } from "./buildMenu.js";
import { jlog } from "./jlog.js";

/**
 * Register every event handler of the pet window: Tauri event listeners
 * ("settings-changed", "pet-state", "pet-say"), the sprite mousedown handler
 * (OS drag + manual double-click), the window onMoved handler (run animation
 * + settle timer), and the contextmenu handler (native menu popup).
 *
 * Side effects: subscribes listeners and DOM/window handlers; the handlers
 * themselves move/resize the window, mutate `latest`/`trip`/`rt`, write the
 * DOM, and emit events.
 *
 * @returns {void}
 */
export function initEvents() {
  // Follow live changes from the settings window.
  listen("settings-changed", (event) => {
    setLanguage(event.payload?.language);
    applySettings(event.payload);
  });

  // The stats window broadcasts care values (as percentages) every change.
  listen("pet-state", ({ payload }) => {
    updateResting(payload.care);
    if (Array.isArray(payload.customForms)) rt.customForms = payload.customForms;
    applySpecies(payload.species);
    if (typeof payload.callMe === "string" && payload.callMe.trim()) {
      latest.callMe = payload.callMe.trim();
    }
    if (payload.care) latest.care = payload.care;
    latest.journal = payload.touring?.journals?.[0] ?? latest.journal;
    // A fresh name (Pet Center rename) makes the pet act bashful.
    if (typeof payload.name === "string" && payload.name) {
      if (rt.lastName !== null && payload.name !== rt.lastName) playOnce("shy", 2500);
      rt.lastName = payload.name;
    }
    const hadCaretaker = latest.caretaking !== null;
    latest.activity = payload.activity?.active ?? null;
    latest.caretaking = payload.caretaking?.active ?? null;
    // Someone new is looking after the pet — bashful too.
    if (!hadCaretaker && latest.caretaking) playOnce("shy", 2500);
    const touringNow = payload.activity?.active?.type === "tour";
    if (touringNow && !trip.away) {
      jlog("tour detected -> departing");
      departForTrip();
    } else if (!touringNow && trip.away) {
      jlog("tour over -> returning");
      returnFromTrip();
    } else {
      maybeComplain();
    }
  });

  // Extensions can put words in the pet's mouth (bridge "say" request, relayed by
  // the hub as a pet-say event). Skipped while the pet is away on a tour.
  listen("pet-say", ({ payload }) => {
    const text = String(payload?.text ?? "").trim().slice(0, 200);
    if (!text || trip.away) return;
    const ms = Math.min(30_000, Math.max(1000, Number(payload?.ms) || 5000));
    say(text, ms);
  });

  // A won Fight Club battle earns a victory pounce.
  listen("fight-result", ({ payload }) => {
    if (payload?.win) playOnce("pounce", 2400);
  });

  // Stats-side reactions (currently: a toy was used — playtime pounce).
  listen("pet-react", ({ payload }) => {
    if (payload?.kind === "play") playOnce("pounce", 2400);
  });

  // Left-drag hands the gesture to the OS so the whole window moves with the
  // cursor; direction feedback comes from the window's move events below.
  // Double-click opens the world window — detected by hand from mousedown
  // timestamps, because startDragging swallows the native dblclick event.
  petEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const now = Date.now();
    rt.lastUserActionAt = now;
    if (now - rt.lastPressAt < DOUBLE_CLICK_MS) {
      rt.lastPressAt = 0;
      playOnce("wave", 2000);
      openHub("home");
      return;
    }
    rt.lastPressAt = now;
    appWindow.startDragging();
  });

  // The cursor passing over the pet counts as the user being around (the
  // click-through watcher only lets events through while it's over the
  // sprite) — used to gate daytime inactivity naps.
  window.addEventListener("mousemove", () => {
    rt.lastUserActionAt = Date.now();
  });

  appWindow.onMoved(({ payload }) => {
    if (rt.animating || trip.away) return; // programmatic travel movement
    if (rt.lastX !== null) {
      const dx = payload.x - rt.lastX;
      if (dx > 1) {
        setAnim("run-right");
      } else if (dx < -1) {
        setAnim("run-left");
      }
    }
    rt.lastX = payload.x;

    // No move events for a moment -> the drag stopped, go back to idle.
    clearTimeout(rt.settleTimer);
    rt.settleTimer = setTimeout(async () => {
      setAnim(idleAnim());
      await clampToScreen();
      // Remember the resting spot so the pet respawns there next launch.
      try {
        const pos = await appWindow.outerPosition();
        emit("pet-moved", { x: pos.x, y: pos.y });
      } catch (e) {
        console.error("failed to report position:", e);
      }
    }, 200);
  });

  window.addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    rt.lastUserActionAt = Date.now();
    const menu = await buildMenu();
    await menu.popup();
  });
}
