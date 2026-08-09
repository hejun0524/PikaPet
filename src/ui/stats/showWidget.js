// stats/showWidget.js — Add-on tray widgets: mount one add-on's widget
// iframe below the popover (see widgetBox.js for the protocol overview).

import { convertFileSrc } from "../shared/tauri.js";
import { runtime } from "./state.js";
import { widgetBox } from "./widgetBox.js";
import { resizePopover } from "./resizePopover.js";

/**
 * Create the widget box + sandboxed iframe for an installed add-on that
 * declares a widget page (no-op if it has none, or is already showing).
 * Side effects: DOM writes (#widgets) and a popover resize.
 *
 * @param {string} id - Add-on id.
 * @returns {void}
 */
export function showWidget(id) {
  const addon = runtime.installedAddons.find((a) => a.id === id);
  if (!addon?.widget || !addon.dir || widgetBox(id)) return;
  const box = document.createElement("div");
  box.className = "widget-box";
  box.dataset.addon = id;
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  const height = Math.max(32, Math.min(220, Number(addon.widgetHeight) || 64));
  frame.style.height = `${height}px`;
  frame.src = convertFileSrc(`${addon.dir}/${addon.widget}`);
  box.appendChild(frame);
  document.getElementById("widgets").appendChild(box);
  resizePopover();
}
