// main.js — entry point of the pet window (the desktop sprite): settings,
// speech bubble, mood, trip travel animation, dragging, and the right-click
// menu. Every function lives in main/ — this file only wires them together.

import { installErrorLogging } from "./shared/jlog.js";
import { jlog } from "./main/jlog.js";
import { boot } from "./main/boot.js";
import { initEvents } from "./main/initEvents.js";
import { initHitbox } from "./main/initHitbox.js";
import { initIdleVariety } from "./main/initIdleVariety.js";

installErrorLogging(jlog);

boot();
initEvents();
initHitbox();
initIdleVariety();
