// stats/boot.js — Boot sequence of the stats window.

import { invoke } from "../shared/tauri.js";
import { setLanguage } from "../shared/i18n.js";
import { pet, runtime } from "./state.js";
import { load } from "./load.js";
import { rescanExtensions } from "./rescanExtensions.js";
import { autoShowWidgets } from "./autoShowWidgets.js";
import { refreshPika } from "./refreshPika.js";
import { refreshKitchen } from "./refreshKitchen.js";
import { applyBankInterest } from "./applyBankInterest.js";
import { processPlan } from "./processPlan.js";
import { processCaretaking } from "./processCaretaking.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";
import { jlog } from "./jlog.js";

/**
 * Boot the stats window: load the save file, scan extensions, refresh Pika's
 * store and bank interest, resume queued plans/shifts, then render, save,
 * and broadcast the first snapshot.
 * Side effects: mutates pet/runtime, DOM writes, saves, broadcasts, logs.
 *
 * @returns {Promise<void>}
 */
export async function boot() {
  await load();
  setLanguage(pet.settings.language);
  try {
    runtime.dataPaths = await invoke("get_data_paths"); // custom-form sheets live under pets/
  } catch (e) {
    console.error("get_data_paths failed:", e);
  }
  await rescanExtensions();
  refreshPika();
  refreshKitchen();
  applyBankInterest();
  processPlan(); // resume a queued plan if nothing was active
  processCaretaking();
  render();
  autoShowWidgets(); // widgetAuto extensions (e.g. Caffeine) hang below at once
  save();
  broadcastState();
  jlog("boot complete, tick timer armed");
}
