const { invoke } = window.__TAURI__.core;
const { emit } = window.__TAURI__.event;

// First-run setup: pick a species (free), name the pet, set what it calls
// you. On start, the stats window initializes + saves the game state, then
// finish_setup reveals the pet.
let chosen = SPECIES[0].key;

function renderCards() {
  document.getElementById("species-cards").innerHTML = SPECIES.map(
    (s) => `
    <div class="species-card ${s.key === chosen ? "selected" : ""}" data-species="${s.key}">
      <span class="thumb" style="background-image:url('${s.sheet}')"></span>
      <span class="breed">${s.breed}</span>
      <span class="free">Free for your first friend!</span>
    </div>`
  ).join("");
}

document.getElementById("species-cards").addEventListener("click", (e) => {
  const card = e.target.closest("[data-species]");
  if (!card) return;
  // Follow the species' default name unless the user typed their own.
  const nameInput = document.getElementById("setup-name");
  const untouched = nameInput.value.trim() === findSpecies(chosen).defaultName;
  chosen = card.dataset.species;
  if (untouched || !nameInput.value.trim()) {
    nameInput.value = findSpecies(chosen).defaultName;
  }
  renderCards();
  refreshStart();
});

function refreshStart() {
  document.getElementById("setup-start").disabled =
    !document.getElementById("setup-name").value.trim();
}
document.getElementById("setup-name").addEventListener("input", refreshStart);

document.getElementById("setup-start").addEventListener("click", () => {
  const name = document.getElementById("setup-name").value.trim().slice(0, 20);
  const callMe = document.getElementById("setup-callme").value.trim().slice(0, 12) || "Owner";
  if (!name) return;
  emit("setup-complete", { species: chosen, name, callMe });
  // Give the stats window a beat to persist before revealing the pet.
  setTimeout(() => invoke("finish_setup"), 400);
});

document.getElementById("setup-quit").addEventListener("click", () => invoke("quit"));

renderCards();
refreshStart();
window.addEventListener("contextmenu", (e) => e.preventDefault());
