# 🐾 Pika Pet

A cross-platform desktop pet (in the spirit of QQ Pet, with a Codex-pet-style companion vibe), built with [Tauri v2](https://tauri.app). A pet — Chocolate Toy Poodle 🐩 or White Cat 🐈 — lives on your desktop, talks to you in speech bubbles, goes to school, works jobs, tours the world, and reports back through a macOS menu bar popover. Zip-installable add-ons extend it, and the UI speaks six languages.

## Getting Started

### Prerequisites

| Tool | Install | Notes |
|---|---|---|
| Rust (stable) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | Compiles the Tauri backend |
| Xcode Command Line Tools (macOS) | `xcode-select --install` | C toolchain for the Rust build |
| Linux only: WebKitGTK dev packages | see [Tauri prerequisites](https://tauri.app/start/prerequisites/) | Not needed on macOS/Windows |

No Node.js required — the UI is plain vanilla JS with no build step.

### Run

```bash
git clone <this repo>
cd PikaPet
cargo run          # compile + launch from the repo root (first build takes a few minutes)
```

First launch opens a Welcome window: pick a species (free), name your pet, tell it what to call you.

### Build a distributable app

```bash
cargo install tauri-cli --version "^2"   # one-time
cargo tauri build                        # from the repo root; outputs to target/release/bundle/
```

On macOS this produces a `.app` for /Applications; Settings → "Show up when computer starts" registers it as a Launch Agent.

## Documentation

| Doc | What's inside |
|---|---|
| [🏗️ Architecture](doc/architecture.md) | Repo layout, the four windows, state ownership & persistence, embedding/rebuild gotchas |
| [🐩 Desktop pet, tray & care](doc/desktop-pet.md) | The sprite, speech bubbles, right-click menu, tray popover, care meters & traits, first run/reset |
| [🏘️ The hub](doc/hub.md) | All eleven views: Home, Life, Career, Touring, Achievements, Pika's Trading Post, Darcy's Fight Club, Noonie's Delivery Service, Pet Center, Add-ons, Settings |
| [🌐 Languages](doc/languages.md) | The i18n system (en/zh/fr/es/de/ja), how names are translated, adding a language or new strings |
| [🧩 Add-ons](doc/addons.md) | Using add-ons + the full developer guide: zip format, manifest, bridge API, tray widgets, localization |
| [🧭 Roadmap](doc/roadmap.md) | The auto-update plan, debug knobs, and the to-do table |
