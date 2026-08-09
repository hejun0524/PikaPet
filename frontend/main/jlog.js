// main/jlog.js — stdout logger of the pet window.

import { makeJlog } from "../shared/jlog.js";

/** Logger forwarding `"pet: <msg>"` to the app's stdout. */
export const jlog = makeJlog("pet");
