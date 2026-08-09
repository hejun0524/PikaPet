// addon-window.js — entry point for add-on popup windows (opened via the
// "open-window" bridge request). Loads ?id=<addon>&page=<file> in a
// sandboxed iframe and serves the same postMessage bridge as the hub (see
// doc/addons.md).
//
// Each function lives in its own file under addon-window/; this file only
// wires them together.

import { initBridge } from "./addon-window/initBridge.js";
import { boot } from "./addon-window/boot.js";

initBridge();
boot();
