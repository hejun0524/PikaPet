// hub/settingsActions.js — the actual effect of every settings control,
// factored out so the Settings → General checkboxes/inputs and the
// Developer console (pikaCommands.js) run the exact same code rather than
// two parallel implementations that could drift apart.

import { invoke, emit, WebviewWindow } from "../shared/tauri.js";
import { setLanguage, getLocale } from "../shared/i18n.js";
import { ui, appSettings } from "./state.js";
import { setView } from "./setView.js";
import { renderAll } from "./renderAll.js";

function pushSettingsChange() {
  emit("settings-changed", { ...appSettings });
}

/** Pet size, as a 50–150 percent scale. Out-of-range values are clamped. */
export function setScale(percent) {
  const clamped = Math.min(150, Math.max(50, Math.round(percent)));
  appSettings.scale = clamped / 100;
  pushSettingsChange();
  return clamped;
}

/** Show the desktop pet on every virtual desktop/Space. */
export function setAllDesktops(on) {
  appSettings.allDesktops = on;
  pushSettingsChange();
}

/** Freeze status decay and hide most of the game while on — see doc/desktop-pet.md's Focus Mode section. */
export function setFocusMode(on) {
  appSettings.focusMode = on;
  pushSettingsChange();
  // Don't strand the user on a page Focus Mode is about to hide; setView
  // already calls renderAll(), so only call it here when it didn't run.
  if (on && ui.view !== "extensions" && ui.view !== "settings" && !ui.view.startsWith("extension:")) {
    setView("extensions");
  } else {
    renderAll();
  }
}

/** App display language — a LANGUAGE_OPTIONS key, or "auto". */
export function setLanguageSetting(code) {
  appSettings.language = code;
  setLanguage(code);
  pushSettingsChange();
  invoke("set_current_locale", { locale: getLocale() }).catch(() => {});
  // Live extension pages get told too, so they can re-render themselves.
  for (const id of ui.openExtensionIds) {
    invoke("ext_push", { id, kind: "app-locale", data: { locale: getLocale() } }).catch(() => {});
  }
  renderAll();
}

/** Pause status decay while the computer is asleep. */
export function setPauseOnSleep(on) {
  appSettings.pauseOnSleep = on;
  pushSettingsChange();
}

/** Speed up the game clock (care decay every 10s instead of 3 minutes). */
export function setDevMode(on) {
  appSettings.devMode = on;
  pushSettingsChange();
}

/** Freeze status decay — a plain testing toggle, no UI restrictions (compare setFocusMode). */
export function setDevFreeze(on) {
  appSettings.devFreeze = on;
  pushSettingsChange();
}

/** Launch PikaPet automatically at login. Not part of appSettings/save.json
 * at all — this asks the OS directly and is re-read via refreshAutostart(). */
export async function setAutostart(on) {
  await invoke(on ? "plugin:autostart|enable" : "plugin:autostart|disable");
}

/** Show/hide the desktop pet sprite. Also not part of appSettings — this
 * reads/writes the "main" window's real visibility directly. */
export async function setPetVisible(visible) {
  const petWin = await WebviewWindow.getByLabel("main");
  if (visible) await petWin.show();
  else await petWin.hide();
}
