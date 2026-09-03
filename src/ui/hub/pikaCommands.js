// hub/pikaCommands.js — the Settings → Developer console's command set.
// Every command starts with "pika" (e.g. "pika help"); parsing/validation
// happens here, the actual effect is either a call into settingsActions.js
// (the same code the General tab's checkboxes use) or a "pika-action" event
// for one-shot stats-side mutations the stats window owns (coins, care,
// achievements) — see stats/initEvents.js's "pika-action" listener.

import { emit } from "../shared/tauri.js";
import { LANGUAGE_OPTIONS } from "../shared/i18n.js";
import { state, appSettings } from "./state.js";
import { formInfo } from "./formInfo.js";
import {
  setScale,
  setAllDesktops,
  setFocusMode,
  setLanguageSetting,
  setAutostart,
  setPetVisible,
  setPauseOnSleep,
  setDevMode,
  setDevFreeze,
} from "./settingsActions.js";

const ok = (text) => ({ lines: [{ type: "success", text }] });
const err = (text) => ({ lines: [{ type: "error", text }] });
const info = (lines) => ({ lines: lines.map((text) => ({ type: "info", text })) });

/** Reads args[0] as "on"/"off"; null if missing/invalid. */
function readOnOff(args) {
  if (args[0] === "on") return true;
  if (args[0] === "off") return false;
  return null;
}

/** Reads args[0] as an integer within [min, max]; null if missing/invalid. */
function readInt(args, min, max) {
  if (args[0] === undefined || args[0] === "") return null;
  const n = Number(args[0]);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

const LANGUAGE_CODES = LANGUAGE_OPTIONS.map((o) => o.key);

const COMMANDS = [
  {
    name: "help",
    usage: "pika help",
    desc: "List every command",
    run: async () => info(HELP_LINES),
  },
  {
    name: "clear",
    usage: "pika clear",
    desc: "Clear this console",
    run: async () => ({ lines: [], clear: true }),
  },
  {
    name: "whoami",
    usage: "pika whoami",
    desc: "Show pet info",
    run: async () => {
      const breed = formInfo(state.species).breed;
      return info([
        `${state.name} — ${breed}, called "${state.callMe}"`,
        `Coins: ${state.coins.toLocaleString()}`,
        `Care: energy ${state.care.energy}  hygiene ${state.care.hygiene}  mood ${state.care.mood}  health ${state.care.health}`,
        `Focus Mode: ${appSettings.focusMode ? "on" : "off"}  Freeze: ${appSettings.devFreeze ? "on" : "off"}  Fast-mode: ${appSettings.devMode ? "on" : "off"}`,
      ]);
    },
  },
  {
    name: "set-size",
    usage: "pika set-size <50-150>",
    desc: "Pet size, in percent",
    run: async (args) => {
      const n = readInt(args, 50, 150);
      if (n === null) return err(`"set-size" needs a whole number 50–150. Usage: pika set-size 80`);
      const applied = setScale(n);
      return ok(`Pet size set to ${applied}%.`);
    },
  },
  {
    name: "set-lang",
    usage: "pika set-lang <code>",
    desc: `Language (${LANGUAGE_CODES.join(", ")})`,
    run: async (args) => {
      const code = args[0];
      if (!code || !LANGUAGE_CODES.includes(code)) {
        return err(`"set-lang" needs one of: ${LANGUAGE_CODES.join(", ")}. Usage: pika set-lang zh`);
      }
      setLanguageSetting(code);
      return ok(`Language set to "${code}".`);
    },
  },
  {
    name: "show-across-desktops",
    usage: "pika show-across-desktops on|off",
    desc: "Show the pet on every desktop/Space",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"show-across-desktops" needs "on" or "off". Usage: pika show-across-desktops on`);
      setAllDesktops(on);
      return ok(`Show across desktops: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "show-on-start",
    usage: "pika show-on-start on|off",
    desc: "Launch PikaPet automatically at login",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"show-on-start" needs "on" or "off". Usage: pika show-on-start on`);
      try {
        await setAutostart(on);
      } catch (e) {
        return err(`"show-on-start" failed: ${e.message ?? e}`);
      }
      return ok(`Launch at login: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "hide",
    usage: "pika hide",
    desc: "Hide the desktop pet",
    run: async () => {
      await setPetVisible(false);
      return ok("Pet hidden. Run \"pika show\" to bring it back.");
    },
  },
  {
    name: "show",
    usage: "pika show",
    desc: "Show the desktop pet",
    run: async () => {
      await setPetVisible(true);
      return ok("Pet is visible.");
    },
  },
  {
    name: "pause-on-sleep",
    usage: "pika pause-on-sleep on|off",
    desc: "Pause status decay while the computer sleeps",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"pause-on-sleep" needs "on" or "off". Usage: pika pause-on-sleep on`);
      setPauseOnSleep(on);
      return ok(`Pause on sleep: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "focus",
    usage: "pika focus on|off",
    desc: "Focus Mode (calm desk-companion mode)",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"focus" needs "on" or "off". Usage: pika focus on`);
      setFocusMode(on);
      return ok(`Focus Mode: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "fast-mode",
    usage: "pika fast-mode on|off",
    desc: "Speed up the game clock (care decays every 10s)",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"fast-mode" needs "on" or "off". Usage: pika fast-mode on`);
      setDevMode(on);
      return ok(`Fast-mode: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "freeze",
    usage: "pika freeze on|off",
    desc: "Freeze status decay (no UI changes, unlike Focus Mode)",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"freeze" needs "on" or "off". Usage: pika freeze on`);
      setDevFreeze(on);
      return ok(`Freeze: ${on ? "on" : "off"}.`);
    },
  },
  {
    name: "coin-shower",
    usage: "pika coin-shower",
    desc: "+20,000 coins",
    run: async () => {
      emit("pika-action", { action: "coin-shower" });
      return ok("+20,000 coins on the way.");
    },
  },
  {
    name: "set-coins",
    usage: "pika set-coins <n>",
    desc: "Set coins to an exact amount",
    run: async (args) => {
      const n = readInt(args, 0);
      if (n === null) return err(`"set-coins" needs a whole number ≥ 0. Usage: pika set-coins 5000`);
      emit("pika-action", { action: "set-coins", value: n });
      return ok(`Coins set to ${n.toLocaleString()}.`);
    },
  },
  {
    name: "heal",
    usage: "pika heal",
    desc: "Max out every care meter",
    run: async () => {
      emit("pika-action", { action: "heal" });
      return ok("All care meters maxed out.");
    },
  },
  {
    name: "sick",
    usage: "pika sick on|off",
    desc: "Force or clear sick status",
    run: async (args) => {
      const on = readOnOff(args);
      if (on === null) return err(`"sick" needs "on" or "off". Usage: pika sick on`);
      emit("pika-action", { action: "sick", value: on });
      return ok(on ? "Health dropped below the sick line." : "Health restored — no longer sick.");
    },
  },
  {
    name: "achieve-all",
    usage: "pika achieve-all",
    desc: "Unlock every touring achievement",
    run: async () => {
      emit("pika-action", { action: "achieve-all" });
      return ok("Every touring \"Explorer\" achievement unlocked.");
    },
  },
];

const HELP_LINES = [
  "Every command starts with \"pika\". Available commands:",
  "",
  ...COMMANDS.map((c) => `  ${c.usage.padEnd(40)}${c.desc}`),
];

/**
 * Parse and run one line of Developer-console input.
 *
 * @param {string} raw - The raw text the user typed (e.g. "pika set-size 80").
 * @returns {Promise<{lines: {type: "success"|"error"|"info", text: string}[], clear?: boolean}>}
 *   Output lines to print, or `{clear: true}` to wipe the console instead.
 */
export async function runPikaCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { lines: [] };
  const tokens = trimmed.split(/\s+/);
  if (tokens[0] !== "pika") {
    return err(`Unknown command "${tokens[0]}" — commands start with "pika". Try "pika help".`);
  }
  const name = tokens[1];
  if (!name) return err(`Missing command. Try "pika help".`);
  const cmd = COMMANDS.find((c) => c.name === name);
  if (!cmd) return err(`Unknown command "${name}". Try "pika help".`);
  try {
    return await cmd.run(tokens.slice(2));
  } catch (e) {
    return err(`"${name}" failed: ${e.message ?? e}`);
  }
}
