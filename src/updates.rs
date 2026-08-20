// src/updates.rs — background auto-update, VSCode/Discord/GitHub-Desktop
// style: Rust checks for an update on startup and on a fixed interval,
// downloads it silently, and installs it in the background — the frontend
// only hears about it once there's something to act on, via the
// "update-phase" event (and `update_status` to query the same thing fresh
// on load, e.g. when the hub window is reopened after the download already
// finished). Nothing ever relaunches on its own; restarting is always the
// user clicking the "Restart to Update" button this state powers.
//
// Windows caveat: `Update::install()` runs the platform installer, and on
// Windows that installer terminates the running process as part of
// installing (the default "passive" install mode also passes the
// installer a restart flag, so it relaunches the app itself once done —
// see `tauri_plugin_updater::WindowsUpdateInstallMode`). That process exit
// can't be deferred once triggered, so `install()` is deliberately NOT
// called in the background on Windows — only `download()` runs there, and
// the downloaded `Update` + bytes are held in `UpdateState::pending_install`
// until the user actually clicks the restart button, at which point exiting
// mid-click is exactly what they asked for. On macOS/Linux, `install()` has
// no such side effect, so it runs immediately once the download finishes,
// and the button click is just `AppHandle::request_restart()`.

use serde::Serialize;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};

/// How often to check for updates in the background, on top of the one
/// check always made at startup. Tune here — there's no user-facing
/// setting for this, same as this app's other background-poll intervals
/// (see `SLEEP_POLL` in main.rs).
pub const CHECK_INTERVAL: Duration = Duration::from_secs(4 * 60 * 60);

#[derive(Clone, Serialize)]
#[serde(tag = "phase", rename_all = "camelCase")]
pub enum UpdatePhase {
    Idle,
    Checking,
    Downloading,
    ReadyToRestart {
        version: String,
        // Only ever true on Windows — see the module doc comment above.
        // Tells the frontend nothing; it's `restart_to_update`'s own logic
        // that branches on this (kept in the payload anyway since it's
        // genuinely part of "what's the state", not UI-only trivia).
        #[serde(rename = "installPending")]
        install_pending: bool,
    },
    UpToDate,
    Error {
        message: String,
    },
}

impl Default for UpdatePhase {
    fn default() -> Self {
        UpdatePhase::Idle
    }
}

#[derive(Default)]
pub struct UpdateState {
    phase: Mutex<UpdatePhase>,
    // Only ever populated on Windows — see the module doc comment above.
    pending_install: Mutex<Option<(Update, Vec<u8>)>>,
}

fn set_phase(app: &AppHandle, phase: UpdatePhase) {
    *app.state::<UpdateState>().phase.lock().unwrap() = phase.clone();
    let _ = app.emit("update-phase", phase);
}

/// Query the current phase directly — used when a window opens (or the
/// user switches back to it) after the phase last changed while it wasn't
/// listening for the "update-phase" event.
#[tauri::command]
pub fn update_status(state: tauri::State<UpdateState>) -> UpdatePhase {
    state.phase.lock().unwrap().clone()
}

/// The "Restart to Update" button's only job. Branches on whether a
/// Windows install was deferred (see the module doc comment): if so,
/// installing now is what actually applies the update, and the process
/// exit/relaunch that follows is the installer's, not ours. Otherwise the
/// update was already installed in the background, so all that's left is
/// asking Tauri to restart into it.
#[tauri::command]
pub fn restart_to_update(app: AppHandle, state: tauri::State<UpdateState>) -> Result<(), String> {
    let pending = state.pending_install.lock().unwrap().take();
    if let Some((update, bytes)) = pending {
        update.install(bytes).map_err(|e| e.to_string())
    } else {
        app.request_restart();
        Ok(())
    }
}

async fn check_now(app: AppHandle) {
    // Skip re-checking once an update is already staged: re-running would
    // either just find the same update again, or — on Windows — clobber
    // the `Update`/bytes pair held for the deferred install with a fresh
    // one while the user hasn't clicked restart yet.
    if matches!(
        *app.state::<UpdateState>().phase.lock().unwrap(),
        UpdatePhase::ReadyToRestart { .. }
    ) {
        return;
    }

    set_phase(&app, UpdatePhase::Checking);

    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            set_phase(&app, UpdatePhase::Error { message: e.to_string() });
            return;
        }
    };

    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => {
            set_phase(&app, UpdatePhase::UpToDate);
            return;
        }
        Err(e) => {
            set_phase(&app, UpdatePhase::Error { message: e.to_string() });
            return;
        }
    };

    set_phase(&app, UpdatePhase::Downloading);
    let version = update.version.clone();
    match update.download(|_chunk, _total| {}, || {}).await {
        Ok(bytes) => {
            if cfg!(target_os = "windows") {
                *app.state::<UpdateState>().pending_install.lock().unwrap() = Some((update, bytes));
                set_phase(
                    &app,
                    UpdatePhase::ReadyToRestart { version, install_pending: true },
                );
            } else {
                match update.install(bytes) {
                    Ok(()) => set_phase(
                        &app,
                        UpdatePhase::ReadyToRestart { version, install_pending: false },
                    ),
                    Err(e) => set_phase(&app, UpdatePhase::Error { message: e.to_string() }),
                }
            }
        }
        Err(e) => set_phase(&app, UpdatePhase::Error { message: e.to_string() }),
    }
}

/// Kick off the startup check immediately, then keep checking every
/// `CHECK_INTERVAL` for the rest of the app's life. Call once from
/// `main.rs`'s `setup` hook.
pub fn spawn_background_checks(app: AppHandle) {
    let startup_app = app.clone();
    tauri::async_runtime::spawn(async move {
        check_now(startup_app).await;
    });

    // Same background-thread-with-sleep shape as this app's other watchers
    // (see `spawn_sleep_watcher` in main.rs) rather than pulling in an
    // async timer just for one interval loop.
    std::thread::spawn(move || loop {
        std::thread::sleep(CHECK_INTERVAL);
        tauri::async_runtime::block_on(check_now(app.clone()));
    });
}
