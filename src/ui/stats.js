// stats.js — entry point of the stats (tray popover) window, the single
// source of truth for the pet's data. Every function lives in its own file
// under stats/ — this file only wires them together: error logging, event
// listeners, the master clock, the compact-mode class, and the boot sequence.

import { installErrorLogging } from "./shared/jlog.js";
import { jlog } from "./stats/jlog.js";
import { initEvents } from "./stats/initEvents.js";
import { initClock } from "./stats/initClock.js";
import { applyTrayCompact } from "./stats/applyTrayCompact.js";
import { boot } from "./stats/boot.js";

installErrorLogging(jlog);

initEvents();
initClock();
applyTrayCompact();
boot();
