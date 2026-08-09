// stats/jlog.js — the stats window's stdout logger.

import { makeJlog } from "../shared/jlog.js";

/** Stdout logger for the stats window (messages prefixed "stats:"). */
export const jlog = makeJlog("stats");
