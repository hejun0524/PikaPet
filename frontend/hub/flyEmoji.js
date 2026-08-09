// hub/flyEmoji.js — Fly animation (shop items → cart, activities → plan book).

/**
 * Animate an emoji flying from one element to another (e.g. a shop card to
 * the cart button), then remove it.
 *
 * Side effects: appends a transient `.fly` span to document.body.
 *
 * @param {string} emoji - The emoji character to animate.
 * @param {Element|null} fromEl - Start element (animation origin).
 * @param {Element|null} toEl - Target element (animation destination).
 * @returns {void}
 */
export function flyEmoji(emoji, fromEl, toEl) {
  if (!fromEl || !toEl) return;
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const span = document.createElement("span");
  span.className = "fly";
  span.textContent = emoji;
  span.style.left = `${from.left + from.width / 2 - 15}px`;
  span.style.top = `${from.top + from.height / 2 - 15}px`;
  document.body.appendChild(span);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      span.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`;
      span.style.opacity = "0.15";
    })
  );
  span.addEventListener("transitionend", () => span.remove(), { once: true });
}
