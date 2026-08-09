// main/buildMenu.js
// The menu is rebuilt on every popup so the End items reflect current state
// (and pick up the active language):
// - End Activity is greyed when idle, or while a caretaker manages things.
// - End Caretaking is greyed when nobody is hired.

import { Menu, PredefinedMenuItem, emit, invoke } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { VIEW_EMOJI, latest } from "./state.js";
import { openHub } from "./openHub.js";

/**
 * Build the pet's right-click native menu from the latest broadcast snapshot.
 * Item actions open hub views, emit "end-activity"/"end-caretaking", or
 * invoke "quit".
 *
 * @returns {Promise<Menu>} The freshly built native menu, ready to popup.
 */
export async function buildMenu() {
  const sep = () => PredefinedMenuItem.new({ item: "Separator" });
  const endActivityText =
    latest.activity?.type === "tour" ? t("menu.callBack") : t("menu.endActivity");
  const viewItems = Object.entries(VIEW_EMOJI).map(([view, emoji]) => ({
    id: view,
    text: `${emoji} ${t(`view.${view}`)}`,
    action: () => openHub(view),
  }));
  return Menu.new({
    items: [
      ...viewItems,
      await sep(),
      {
        id: "end-activity",
        text: endActivityText,
        enabled: !!latest.activity && !latest.caretaking,
        action: () => emit("end-activity"),
      },
      {
        id: "end-caretaking",
        text: t("menu.endCaretaking"),
        enabled: !!latest.caretaking,
        action: () => emit("end-caretaking"),
      },
      await sep(),
      { id: "settings", text: t("menu.settings"), action: () => openHub("settings") },
      { id: "quit", text: t("menu.quit"), action: () => invoke("quit") },
    ],
  });
}
