// main/buildMenu.js
// The menu is rebuilt on every popup so the End items reflect current state:
// - End Activity is greyed when idle, or while a caretaker manages things.
// - End Caretaking is greyed when nobody is hired.

import { Menu, PredefinedMenuItem, emit, invoke } from "../shared/tauri.js";
import { latest } from "./state.js";
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
  const endActivityText = latest.activity?.type === "tour" ? "📢 Call Back" : "🛑 End Activity";
  return Menu.new({
    items: [
      { id: "home", text: "🏠 Home", action: () => openHub("home") },
      { id: "shopping", text: "🧺 Life", action: () => openHub("shopping") },
      { id: "career", text: "💼 Career", action: () => openHub("career") },
      { id: "touring", text: "🗺️ Touring", action: () => openHub("touring") },
      { id: "achievements", text: "🏆 Achievements", action: () => openHub("achievements") },
      { id: "government", text: "💖 Pet Center", action: () => openHub("government") },
      { id: "pika", text: "🐱 Pika", action: () => openHub("pika") },
      { id: "adventure", text: "⚔️ Adventure", action: () => openHub("adventure") },
      { id: "arena", text: "🥊 Arena", action: () => openHub("arena") },
      { id: "addons", text: "🧩 Add-ons", action: () => openHub("addons") },
      await sep(),
      {
        id: "end-activity",
        text: endActivityText,
        enabled: !!latest.activity && !latest.caretaking,
        action: () => emit("end-activity"),
      },
      {
        id: "end-caretaking",
        text: "🛎️ End Caretaking",
        enabled: !!latest.caretaking,
        action: () => emit("end-caretaking"),
      },
      await sep(),
      { id: "settings", text: "⚙️ Settings…", action: () => openHub("settings") },
      { id: "quit", text: "Quit", action: () => invoke("quit") },
    ],
  });
}
