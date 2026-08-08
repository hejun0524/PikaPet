const { getCurrentWindow, currentMonitor, PhysicalPosition, LogicalSize } =
  window.__TAURI__.window;
const { Menu, PredefinedMenuItem } = window.__TAURI__.menu;
const { invoke } = window.__TAURI__.core;
const { listen, emit } = window.__TAURI__.event;

const pet = document.getElementById("pet");
const appWindow = getCurrentWindow();

// Temporary diagnostics: surface webview errors in the app's stdout.
const jlog = (msg) => invoke("log", { msg: `pet: ${msg}` }).catch(() => {});
window.addEventListener("error", (e) => jlog(`ERROR ${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener("unhandledrejection", (e) => jlog(`REJECTION ${e.reason}`));

// Native sprite cell size; the displayed size is CELL * settings.scale,
// applied via CSS zoom + a matching window resize. The window is taller and
// wider than the sprite to leave room for the speech bubble.
const CELL_W = 192;
const CELL_H = 208;
const BUBBLE_SPACE = 84;
const MIN_WINDOW_W = 220;
const DEFAULT_SETTINGS = { scale: 0.5, allDesktops: true };

async function applySettings(s) {
  const scale = typeof s.scale === "number" ? s.scale : DEFAULT_SETTINGS.scale;
  const allDesktops =
    typeof s.allDesktops === "boolean" ? s.allDesktops : DEFAULT_SETTINGS.allDesktops;

  pet.style.zoom = scale;
  await appWindow.setSize(
    new LogicalSize(
      Math.max(MIN_WINDOW_W, Math.round(CELL_W * scale)),
      Math.round(CELL_H * scale) + BUBBLE_SPACE
    )
  );
  await appWindow.setVisibleOnAllWorkspaces(allDesktops);
  clampToScreen();
}

// ── Speech bubble ───────────────────────────────────────────────────────────
const bubbleEl = document.getElementById("bubble");
let bubbleTimer = null;

function say(text, ms = 5000) {
  bubbleEl.textContent = text;
  bubbleEl.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => (bubbleEl.hidden = true), ms);
}

// Latest snapshot of what the pet knows about itself (from broadcasts).
const latest = { callMe: "Owner", care: {}, journal: null, activity: null, caretaking: null };

const LOW_LINE = 35; // matches the orange "low" meter tier
const SICK_LINE = 80; // matches SICK_BELOW in touring.js
const COMPLAINT_COOLDOWN_MS = 3 * 60_000;
let lastComplaintAt = 0;

function maybeComplain() {
  if (trip.away || animating) return;
  const now = Date.now();
  if (now - lastComplaintAt < COMPLAINT_COOLDOWN_MS) return;
  const care = latest.care;
  let msg = null;
  if (typeof care.health === "number" && care.health < SICK_LINE) {
    msg = `I am sick, ${latest.callMe}…`;
  } else if (care.energy < LOW_LINE) {
    msg = `I am hungry, ${latest.callMe}.`;
  } else if (care.hygiene < LOW_LINE) {
    msg = `I need a shower, ${latest.callMe}.`;
  } else if (care.mood < LOW_LINE) {
    msg = `Play with me, ${latest.callMe}!`;
  }
  if (msg) {
    lastComplaintAt = now;
    say(msg);
  }
}

function greet() {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  say(`Good ${period}, ${latest.callMe}!`);
}

// Apply persisted settings on boot, then follow live changes from the
// settings window.
(async () => {
  let saved = {};
  try {
    const raw = await invoke("load_state");
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.error("failed to load settings:", e);
  }
  applySettings(saved.settings ?? {});
  applySpecies(saved.species);
  if (typeof saved.callMe === "string" && saved.callMe.trim()) {
    latest.callMe = saved.callMe.trim();
  }
  // Old saves may still call mood "happiness".
  updateMood(saved.care?.mood ?? saved.care?.happiness);
  latest.activity = saved.activity?.active ?? null;
  latest.caretaking = saved.caretaking?.active ?? null;
  // If the app starts mid-trip, the pet is already away: hide without fanfare.
  if (saved.activity?.active?.type === "tour") {
    trip.monitor = await currentMonitor();
    trip.homePos = await appWindow.outerPosition();
    trip.size = await appWindow.outerSize();
    trip.away = true;
    await appWindow.hide();
  } else {
    setTimeout(greet, 1200);
  }
})();
listen("settings-changed", (event) => applySettings(event.payload));

function setAnim(name) {
  if (pet.dataset.anim !== name) {
    pet.dataset.anim = name;
  }
}

// The Magic Station can swap the sprite sheet; all species share the grid.
let currentSpecies = "toy_poodle";

function applySpecies(species) {
  if (typeof species !== "string" || species === currentSpecies) return;
  currentSpecies = species;
  pet.style.backgroundImage = `url("pets/${species}.webp")`;
}

// ── Mood → sad animation ────────────────────────────────────────────────────
// Below this percent the pet mopes around (sprite row 5) instead of idling.
const SAD_MOOD_BELOW = 35;
let isSad = false;

function idleAnim() {
  return isSad ? "sad" : "idle";
}

function updateMood(mood) {
  isSad = typeof mood === "number" && mood < SAD_MOOD_BELOW;
  // Swap immediately unless a run animation is in progress.
  if (pet.dataset.anim === "idle" || pet.dataset.anim === "sad") {
    setAnim(idleAnim());
  }
}

// The stats window broadcasts care values (as percentages) every change.
listen("pet-state", ({ payload }) => {
  updateMood(payload.care?.mood);
  applySpecies(payload.species);
  if (typeof payload.callMe === "string" && payload.callMe.trim()) {
    latest.callMe = payload.callMe.trim();
  }
  if (payload.care) latest.care = payload.care;
  latest.journal = payload.touring?.journals?.[0] ?? latest.journal;
  latest.activity = payload.activity?.active ?? null;
  latest.caretaking = payload.caretaking?.active ?? null;
  const touringNow = payload.activity?.active?.type === "tour";
  if (touringNow && !trip.away) {
    jlog("tour detected -> departing");
    departForTrip();
  } else if (!touringNow && trip.away) {
    jlog("tour over -> returning");
    returnFromTrip();
  } else {
    maybeComplain();
  }
});

// ── Trip travel animation ───────────────────────────────────────────────────
// Departure: run toward the nearer screen edge, off the screen, then hide.
// Return: reappear at a random edge and run back to the departure spot.
const TRAVEL_STEP_PX = 16; // per 16ms frame

const trip = { away: false, homePos: null, monitor: null, size: null };
let animating = false;

function animateX(fromX, y, targetX) {
  return new Promise((resolve) => {
    const dir = targetX > fromX ? 1 : -1;
    let x = fromX;
    const timer = setInterval(() => {
      x += dir * TRAVEL_STEP_PX;
      const done = dir === 1 ? x >= targetX : x <= targetX;
      appWindow.setPosition(new PhysicalPosition(done ? targetX : x, y));
      if (done) {
        clearInterval(timer);
        resolve();
      }
    }, 16);
  });
}

async function departForTrip() {
  if (animating || trip.away) return;
  animating = true;
  try {
    trip.monitor = await currentMonitor();
    trip.homePos = await appWindow.outerPosition();
    trip.size = await appWindow.outerSize();
    if (!trip.monitor) {
      trip.away = true;
      await appWindow.hide();
      return;
    }
    say(`I'm going out for a tour, ${latest.callMe}!`, 2200);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const { monitor, homePos, size } = trip;
    const centerX = homePos.x + size.width / 2;
    const goLeft = centerX - monitor.position.x < monitor.position.x + monitor.size.width - centerX;
    setAnim(goLeft ? "run-left" : "run-right");
    const targetX = goLeft
      ? monitor.position.x - size.width - 10
      : monitor.position.x + monitor.size.width + 10;
    await animateX(homePos.x, homePos.y, targetX);
    trip.away = true;
    await appWindow.hide();
    jlog("departure complete, pet hidden");
  } finally {
    animating = false;
  }
}

async function returnFromTrip() {
  if (animating || !trip.away) return;
  animating = true;
  try {
    const monitor = trip.monitor ?? (await currentMonitor());
    const homePos = trip.homePos ?? (await appWindow.outerPosition());
    const size = trip.size ?? (await appWindow.outerSize());
    if (!monitor) {
      trip.away = false;
      await appWindow.show();
      setAnim(idleAnim());
      return;
    }
    // Come back from a random edge.
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft
      ? monitor.position.x - size.width - 10
      : monitor.position.x + monitor.size.width + 10;
    await appWindow.setPosition(new PhysicalPosition(startX, homePos.y));
    await appWindow.show();
    setAnim(homePos.x > startX ? "run-right" : "run-left");
    await animateX(startX, homePos.y, homePos.x);
    trip.away = false;
    setAnim(idleAnim());
    if (latest.journal?.cities?.length) {
      say(`I just visited ${latest.journal.cities.join(", ")}, ${latest.callMe}!`, 8000);
    } else {
      say(`I'm back, ${latest.callMe}!`);
    }
  } finally {
    animating = false;
  }
}

// Left-drag hands the gesture to the OS so the whole window moves with the
// cursor; direction feedback comes from the window's move events below.
pet.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    appWindow.startDragging();
  }
});

// If the drag left the pet (partly) outside the screen, snap it back in.
async function clampToScreen() {
  if (animating || trip.away) return; // travel animations go off-screen on purpose
  const monitor = await currentMonitor();
  if (!monitor) return;
  const pos = await appWindow.outerPosition();
  const size = await appWindow.outerSize();
  const minX = monitor.position.x;
  const minY = monitor.position.y;
  const maxX = monitor.position.x + monitor.size.width - size.width;
  const maxY = monitor.position.y + monitor.size.height - size.height;
  const x = Math.min(Math.max(pos.x, minX), maxX);
  const y = Math.min(Math.max(pos.y, minY), maxY);
  if (x !== pos.x || y !== pos.y) {
    await appWindow.setPosition(new PhysicalPosition(x, y));
  }
}

let lastX = null;
let settleTimer = null;

appWindow.onMoved(({ payload }) => {
  if (animating || trip.away) return; // programmatic travel movement
  if (lastX !== null) {
    const dx = payload.x - lastX;
    if (dx > 1) {
      setAnim("run-right");
    } else if (dx < -1) {
      setAnim("run-left");
    }
  }
  lastX = payload.x;

  // No move events for a moment -> the drag stopped, go back to idle.
  clearTimeout(settleTimer);
  settleTimer = setTimeout(async () => {
    setAnim(idleAnim());
    await clampToScreen();
    // Remember the resting spot so the pet respawns there next launch.
    try {
      const pos = await appWindow.outerPosition();
      emit("pet-moved", { x: pos.x, y: pos.y });
    } catch (e) {
      console.error("failed to report position:", e);
    }
  }, 200);
});

function openHub(view) {
  emit("hub-view", { view });
  invoke("show_window", { label: "hub" });
}

// The menu is rebuilt on every popup so the End items reflect current state:
// - End Activity is greyed when idle, or while a caretaker manages things.
// - End Caretaking is greyed when nobody is hired.
async function buildMenu() {
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

window.addEventListener("contextmenu", async (e) => {
  e.preventDefault();
  const menu = await buildMenu();
  await menu.popup();
});
