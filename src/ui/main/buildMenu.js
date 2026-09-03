// main/buildMenu.js
// The menu is rebuilt on every popup so the End items reflect current state
// (and pick up the active language):
// - End Activity is greyed when idle, or while a caretaker manages things.
// - End Caretaking is greyed when nobody is hired.

import { Menu, PredefinedMenuItem, emit, invoke } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { VIEW_EMOJI, latest, rt } from "./state.js";
import { openHub } from "./openHub.js";

/**
 * Build the pet's right-click native menu from the latest broadcast snapshot.
 * Item actions open hub views, emit "end-activity"/"end-caretaking"/a
 * settings change, or invoke "quit". In Focus Mode, shrinks to
 * Extensions/Settings/Quit — the pet's only reachable pages then — and the
 * End items are dropped entirely rather than just greyed (there's no
 * game-facing UI left to manage them from). A Focus Mode toggle is always
 * present so the pet's only path back out of it doesn't depend on the hub
 * being reachable at all.
 *
 * @returns {Promise<Menu>} The freshly built native menu, ready to popup.
 */
export async function buildMenu() {
  const sep = () => PredefinedMenuItem.new({ item: "Separator" });
  const endActivityText =
    latest.activity?.type === "tour" ? t("menu.callBack") : t("menu.endActivity");
  const viewEntries = rt.focusMode
    ? [["extensions", VIEW_EMOJI.extensions]]
    : Object.entries(VIEW_EMOJI);
  const viewItems = viewEntries.map(([view, emoji]) => ({
    id: view,
    text: `${emoji} ${t(`view.${view}`)}`,
    action: () => openHub(view),
  }));
  const endItems = rt.focusMode
    ? []
    : [
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
      ];
  return Menu.new({
    items: [
      ...viewItems,
      await sep(),
      ...endItems,
      {
        id: "focus-mode-toggle",
        text: rt.focusMode ? t("menu.focusModeOff") : t("menu.focusModeOn"),
        action: () => emit("settings-changed", { focusMode: !rt.focusMode }),
      },
      { id: "settings", text: t("menu.settings"), action: () => openHub("settings") },
      { id: "quit", text: t("menu.quit"), action: () => invoke("quit") },
    ],
  });
}
