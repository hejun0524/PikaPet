// stats/showWidget.js — Extension tray widgets: mount one extension's widget
// iframe below the popover (see widgetBox.js for the protocol overview).

import { convertFileSrc } from "../shared/tauri.js";
import { runtime } from "./state.js";
import { widgetBox } from "./widgetBox.js";
import { resizePopover } from "./resizePopover.js";

/**
 * Create the widget box + sandboxed iframe for an installed extension that
 * declares a widget page (no-op if it has none, or is already showing).
 * Side effects: DOM writes (#widgets) and a popover resize.
 *
 * @param {string} id - Extension id.
 * @returns {void}
 */
export function showWidget(id) {
  const extension = runtime.installedExtensions.find((a) => a.id === id);
  if (!extension?.widget || !extension.dir || widgetBox(id)) return;
  const box = document.createElement("div");
  box.className = "widget-box";
  box.dataset.extension = id;
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  const height = Math.max(32, Math.min(220, Number(extension.widgetHeight) || 64));
  frame.style.height = `${height}px`;
  frame.src = convertFileSrc(`${extension.dir}/${extension.widget}`);
  box.appendChild(frame);
  document.getElementById("widgets").appendChild(box);
  resizePopover();
}
