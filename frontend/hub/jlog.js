// hub/jlog.js — the hub window's stdout logger (see shared/jlog.js).

import { makeJlog } from "../shared/jlog.js";

/** Stdout logger for the hub window: forwards `"hub: <msg>"` to the Rust side. */
export const jlog = makeJlog("hub");
