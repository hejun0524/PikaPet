// hub/initSplitter.js — VSCode-style resizable side panel.

/**
 * Wire the draggable splitter between the side panel and the content area:
 * restores the saved width from localStorage, resizes while dragging
 * (clamped to 240–460px), and persists the width on mouseup.
 *
 * Side effects: sets #side's flex-basis, adds mouse listeners, and reads/
 * writes localStorage "sideWidth".
 *
 * @returns {void}
 */
export function initSplitter() {
  const side = document.getElementById("side");
  const splitter = document.getElementById("splitter");
  const savedWidth = Number(localStorage.getItem("sideWidth"));
  if (savedWidth >= 240 && savedWidth <= 460) side.style.flexBasis = `${savedWidth}px`;
  let dragging = false;
  splitter.addEventListener("mousedown", (e) => {
    dragging = true;
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const width = Math.min(460, Math.max(240, e.clientX));
    side.style.flexBasis = `${width}px`;
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    localStorage.setItem("sideWidth", parseInt(side.style.flexBasis, 10) || 232);
  });
}
