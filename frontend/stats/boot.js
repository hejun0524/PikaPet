// stats/boot.js — Boot sequence of the stats window.

import { load } from "./load.js";
import { rescanAddons } from "./rescanAddons.js";
import { refreshPika } from "./refreshPika.js";
import { applyBankInterest } from "./applyBankInterest.js";
import { processPlan } from "./processPlan.js";
import { processCaretaking } from "./processCaretaking.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";
import { jlog } from "./jlog.js";

/**
 * Boot the stats window: load the save file, scan add-ons, refresh Pika's
 * store and bank interest, resume queued plans/shifts, then render, save,
 * and broadcast the first snapshot.
 * Side effects: mutates pet/runtime, DOM writes, saves, broadcasts, logs.
 *
 * @returns {Promise<void>}
 */
export async function boot() {
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
}
