// hub/settingsDeveloperHTML.js — Settings → Developer: a terminal-style
// console for the "pika" command set (see hub/pikaCommands.js). Every
// command here — including the everyday General-tab settings — runs the
// exact same code as its checkbox/input equivalent.

import { terminalLinesHTML } from "./terminalOutput.js";
import { ui } from "./state.js";

const WELCOME = [
  { type: "info", text: "PikaPet Developer Console — type \"pika help\" for a list of commands." },
];

/**
 * @returns {string} Page HTML for the Developer settings tab.
 */
export function settingsDeveloperHTML() {
  if (ui.terminalLines.length === 0) ui.terminalLines = [...WELCOME];
  return `
    <div class="settings-plain settings-plain-wide">
      <div class="pika-terminal">
        <div class="pika-output" id="pika-output">${terminalLinesHTML()}</div>
        <div class="pika-input-row">
          <span class="pika-caret">$</span>
          <input type="text" id="pika-input" class="pika-input" autocomplete="off" spellcheck="false"
            placeholder="pika help" />
        </div>
      </div>
    </div>`;
}
