// hub/terminalOutput.js — rendering for the Settings → Developer console's
// output log (see pikaCommands.js for what actually runs).

import { ui } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * Render `ui.terminalLines` to the same HTML both the initial page paint
 * (settingsDeveloperHTML.js, a pure string builder) and every later
 * per-command update (renderTerminalOutput, a direct DOM write) use — one
 * line-to-markup mapping, so the two call sites can never drift apart.
 *
 * @returns {string} One `<div class="pika-line pika-<type>">` per line.
 */
export function terminalLinesHTML() {
  return ui.terminalLines.map((l) => `<div class="pika-line pika-${esc(l.type)}">${esc(l.text)}</div>`).join("");
}

/**
 * Repaint just the terminal's output log from `ui.terminalLines` and
 * scroll it to the bottom — used after every command instead of a full
 * renderGrid(), so the input field never loses focus or its in-progress
 * text mid-command.
 *
 * @returns {void}
 */
export function renderTerminalOutput() {
  const out = document.getElementById("pika-output");
  if (!out) return;
  out.innerHTML = terminalLinesHTML();
  out.scrollTop = out.scrollHeight;
}
