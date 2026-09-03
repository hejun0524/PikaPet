# 🚀 Building & Releasing

This covers building PikaPet itself for macOS and Windows, and shipping a
new app version through the auto-updater. For extensions — a completely
separate release surface with its own signing key and its own GitHub
Releases repo — see [extensions.md](extensions.md)'s "Publishing to the
Marketplace" instead.

## Building for macOS

```bash
git clone https://github.com/hejun0524/PikaPet
cd PikaPet
cargo run                                # dev: compile + launch (first build takes a few minutes)
```

Distributable build:

```bash
cargo install tauri-cli --version "^2"   # one-time
cargo tauri build                        # outputs to target/release/bundle/
```

Produces, under `target/release/bundle/`:
- `macos/MyPet.app` and `dmg/MyPet_<version>_<arch>.dmg` — the normal
  installer. **The `.dmg` is the only file end users should ever download.**
- `macos/MyPet.app.tar.gz` + `macos/MyPet.app.tar.gz.sig` — the updater
  artifacts (only ever consumed by the app's own background updater, never
  by a person — see "Shipping an update" below).

`<arch>` and the `darwin-*` platform key (see below) depend on which Mac
you build on — `aarch64` for Apple Silicon, `x86_64` for Intel. Building on
one only produces that architecture's bundle; there's no universal-binary
step configured here.

## Building for Windows

Tauri can't cross-compile a real Windows installer from macOS — the NSIS/MSI
bundler and the WebView2 linking both need an actual Windows toolchain.
Build on a Windows machine or VM instead (this repo's icons already include
`icons/icon.ico` and the Windows Store-tile PNGs, so nothing extra is needed
there):

1. Install [Rust](https://rustup.rs) via `rustup`.
2. Install the **"Desktop development with C++"** workload from the
   [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio) —
   this is what gives Rust's `x86_64-pc-windows-msvc` target a linker.
   WebView2 itself ships with Windows 10/11 already.
3. `cargo install tauri-cli --version "^2"`.
4. `git clone https://github.com/hejun0524/PikaPet && cd PikaPet`.
5. If you're also producing signed updater artifacts on this machine, set
   `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (see
   "Shipping an update" below — same two env vars as macOS, same key file,
   just copied over).
6. `cargo tauri build`.

Outputs land under `target\release\bundle\`:
- `nsis\MyPet_<version>_x64-setup.exe` (and/or `msi\MyPet_<version>_x64_en-US.msi`,
  depending on `tauri.conf.json`'s `bundle.targets` — currently `"all"`, so
  both get built) — the installer end users download.
- The updater artifacts sit next to whichever installer format Tauri's
  Windows updater bundler is configured for, plus a matching `.sig` — same
  idea as macOS's `.tar.gz`/`.sig` pair, just a different file extension.

Copy whatever lands in `target\release\bundle\` back to wherever you're
assembling the release (a shared folder, a USB stick, `dist/` on the Mac —
doesn't matter, it's just files).

## Shipping an update

The auto-updater (`src/updates.rs`, background check/download/install, "🔄
Restart to Update" button — see [roadmap.md](roadmap.md) for how it works)
is signed and pointed at a real repo already:

- `tauri.conf.json`'s `plugins.updater.pubkey` holds the real public key.
- Its `endpoints` URL points at `https://github.com/hejun0524/PikaPet/releases/latest/download/latest.json`.
- The matching private key lives at `pikapet-updater.key` (gitignored,
  generated once via `cargo tauri signer generate`) — needed on whichever
  machine actually runs `cargo tauri build` for a release. **Losing this
  file means you can never ship a real update again** without also
  changing `pubkey` and breaking every already-installed copy's trust of
  future updates — back it up somewhere safe, outside this repo.

Every release:

1. Bump `"version"` in **both** `tauri.conf.json` and `Cargo.toml`'s
   `[package]` section — they should always match.
2. On each platform you're releasing for, with the signing env vars set
   (see "Building for macOS/Windows" above):
   ```bash
   cargo tauri build
   ```
3. Collect every platform's `.sig` file's contents and its matching
   installer download URL, and write (or update) one combined `latest.json`:
   ```json
   {
     "version": "0.2.0",
     "notes": "What changed.",
     "pub_date": "2026-09-03T17:00:00Z",
     "platforms": {
       "darwin-aarch64": {
         "signature": "<contents of MyPet.app.tar.gz.sig from the Apple Silicon build>",
         "url": "https://github.com/hejun0524/PikaPet/releases/download/v0.2.0/MyPet.app.tar.gz"
       },
       "darwin-x86_64": {
         "signature": "<contents of MyPet.app.tar.gz.sig from the Intel build, if you built one>",
         "url": "https://github.com/hejun0524/PikaPet/releases/download/v0.2.0/MyPet.app.tar.gz"
       },
       "windows-x86_64": {
         "signature": "<contents of the Windows build's .sig>",
         "url": "https://github.com/hejun0524/PikaPet/releases/download/v0.2.0/MyPet_0.2.0_x64-setup.exe"
       }
     }
   }
   ```
   Only include the platform keys you actually built for this release — an
   already-installed macOS copy ignores the `windows-x86_64` entry (and
   vice versa), so it's fine for the set of platforms to grow release by
   release rather than needing all three from day one. macOS and Windows
   each need their own `.tar.gz`/installer built on that OS — the `url` for
   `darwin-aarch64` and `darwin-x86_64` both point at the *same* filename
   here only because a single Apple Silicon build happens to be what's
   released so far; if you ever build both Mac architectures separately,
   give the Intel one its own filename so the two URLs don't collide.
4. Create a GitHub Release (tag `v<version>`, matching what you just built),
   make sure it's the one marked **"Latest release"** (that's what
   `releases/latest/download/...` actually resolves to), and upload: every
   installer (`.dmg`, `.exe`/`.msi`), every updater payload (`.tar.gz` +
   `.sig` per platform), and `latest.json`.
5. Verify: `curl -sL https://github.com/hejun0524/PikaPet/releases/latest/download/latest.json`
   should return exactly what you uploaded.
6. Test the real update on a machine that isn't the one that built it —
   launch an older installed copy and confirm the "Restart to Update"
   button appears. **macOS caveat**: replacing an app in place generally
   wants the `.app` to be Developer-ID signed and notarized, or Gatekeeper
   can block the swapped-in update from launching — if `MyPet.app` isn't
   notarized, confirm this step actually works rather than assuming it
   does.
