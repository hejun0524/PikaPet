// Shared pet-panel rendering (care meters, traits, coins) used by the stats
// popover and the bag window's side panel. Loaded as a plain <script> after
// items.js.

// Below this percent a meter is "critical" (red bar); critical meters also
// drain health (see stats.js tick()).
const CRITICAL_BELOW = 15;

// Bar color switches as a meter empties (percent of max, checked low→high).
const BAR_LEVELS = [
  { className: "critical", below: CRITICAL_BELOW }, // red
  { className: "low", below: 35 },                  // orange
  { className: "warn", below: 60 },                 // yellow
];

function barClassFor(value, max) {
  const pct = (value / max) * 100;
  const level = BAR_LEVELS.find((l) => pct < l.below);
  return level ? ` ${level.className}` : "";
}

function meterHTML({ key, emoji, label, value, max }) {
  return `
    <div class="meter" data-stat="${key}">
      <label><span class="emoji">${emoji}</span>${label}</label>
      <div class="track"><div class="fill${barClassFor(value, max)}" style="width: ${(value / max) * 100}%"></div></div>
      <span class="value">${value}</span>
    </div>`;
}

function traitHTML({ key, emoji, label, value }) {
  return `
    <div class="trait" data-stat="${key}">
      <label><span class="emoji">${emoji}</span>${label}</label>
      <span class="value">${value}</span>
    </div>`;
}

function coinsHTML(coins) {
  return traitHTML({ key: "coins", emoji: "💰", label: "Pocket", value: coins.toLocaleString() });
}

// Four equal care cards: the background fill rises with the meter's value,
// colored by the same thresholds as the old bars.
function careCardsHTML(meters) {
  return `<div class="care-cards">${meters
    .map((m) => {
      const pct = (m.value / m.max) * 100;
      const level = barClassFor(m.value, m.max).trim();
      return `
    <div class="care-card ${level}" data-stat="${escText(m.key)}">
      <div class="cc-fill" style="height:${pct}%"></div>
      <span class="tc-value">${escText(String(m.value))}</span>
      <span class="tc-label">${m.emoji} ${escText(m.label)}</span>
    </div>`;
    })
    .join("")}</div>`;
}

// Three equal trait cards filling the row: value, emoji and name each.
function traitCardsHTML(traits) {
  return `<div class="trait-cards">${traits
    .map(
      (t) => `
    <div class="trait-card" data-stat="${escText(t.key)}">
      <span class="tc-value">${escText(String(t.value))}</span>
      <span class="tc-label">${t.emoji} ${escText(t.label)}</span>
    </div>`
    )
    .join("")}</div>`;
}

function escText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

// One button per add-on, for the popover and the hub side panel.
function addonButtonsHTML(addons) {
  return addons
    .map(
      (a) => `<button class="addon-btn" data-addon="${escText(a.id)}" title="${escText(a.name)}">${escText(a.emoji)}</button>`
    )
    .join("");
}

// Caretaker-on-duty badge (expects the `caretaking` shape from the
// pet-state broadcast; empty string when nobody is hired).
function caretakingStatusHTML(caretaking) {
  const active = caretaking?.active;
  if (!active) return "";
  return `
    <div class="status-badge">
      🛎️ ${active.emoji} ${active.name} on duty · ${formatRemaining(active.remainingMs)} left
    </div>`;
}

// Busy badge shown while the pet is in a class or job (expects the
// `activity` shape from the pet-state broadcast; empty string when idle).
function activityStatusHTML(activity) {
  const active = activity?.active;
  if (!active) return "";
  const verb =
    active.type === "job" ? "💼 Working" : active.type === "tour" ? "🧳 Touring" : "📚 Studying";
  return `
    <div class="status-badge">
      ${verb}: ${active.emoji} ${active.name} · ${formatRemaining(active.remainingMs)} left
    </div>`;
}
