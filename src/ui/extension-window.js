// extension-window.js — entry point for extension popup windows (opened via the
// "open-window" bridge request). Loads ?id=<extension>&page=<file> in a
// sandboxed iframe and serves the same postMessage bridge as the hub (see
// doc/extensions.md).
//
// Each function lives in its own file under extension-window/; this file only
// wires them together.

import { initBridge } from "./extension-window/initBridge.js";
import { boot } from "./extension-window/boot.js";

initBridge();
boot();
