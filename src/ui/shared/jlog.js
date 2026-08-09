// shared/jlog.js — temporary diagnostics: surface webview console/errors in
// the app's stdout via the Rust `log` command, so problems inside hidden
// webviews are visible when running `tauri dev` from a terminal.

import { invoke } from "./tauri.js";

/**
 * Build a stdout logger for one window.
 *
 * @param {string} prefix - Window name shown before each message
 *   (e.g. "hub", "stats", "pet").
 * @returns {(msg: string) => void} Logger that forwards `"<prefix>: <msg>"`
 *   to the Rust side; logging failures are swallowed (diagnostics must never
 *   break the app).
 */
export function makeJlog(prefix) {
  return (msg) => invoke("log", { msg: `${prefix}: ${msg}` }).catch(() => {});
}

/**
 * Wire global error reporting for the current window: uncaught exceptions and
 * unhandled promise rejections are forwarded to the given logger.
 *
 * @param {(msg: string) => void} jlog - Logger created by {@link makeJlog}.
 * @returns {void}
 */
export function installErrorLogging(jlog) {
  window.addEventListener("error", (e) => jlog(`ERROR ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => jlog(`REJECTION ${e.reason}`));
}
