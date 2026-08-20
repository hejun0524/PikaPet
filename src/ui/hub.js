// hub.js — entry point of the hub window ("<pet>'s World"). Every function
// lives in its own file under hub/ (state in hub/state.js, tab sets in
// hub/constants.js); this file only wires them together: error logging,
// event listeners, the extension bridge, state sync, and the initial boot.

import { jlog } from "./hub/jlog.js";
import { installErrorLogging } from "./shared/jlog.js";
import { initSplitter } from "./hub/initSplitter.js";
import { initEvents } from "./hub/initEvents.js";
import { initExtensionHostResize } from "./hub/initExtensionHostResize.js";
import { initWidgetActionRelay } from "./hub/initWidgetActionRelay.js";
import { initMarketRefresh } from "./hub/marketRefresh.js";
import { initSync } from "./hub/initSync.js";
import { initUpdateFlow } from "./hub/updateFlow.js";
import { boot } from "./hub/boot.js";

installErrorLogging(jlog);

initSplitter();
initEvents();
initExtensionHostResize();
initWidgetActionRelay();
initMarketRefresh();
initSync();
initUpdateFlow();
boot();

window.addEventListener("contextmenu", (e) => e.preventDefault());
jlog("script eval complete");
