#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

// ── Pet click-through ───────────────────────────────────────────────────────
// The pet window is a transparent rectangle much larger than the sprite; the
// desktop underneath must stay clickable. The webview reports the sprite's
// bounding box (logical px, window-relative) and a background thread polls
// the global cursor: outside the box the window ignores mouse events
// (clicks fall through to the desktop), inside it they're accepted so
// dragging and the right-click menu keep working.
struct PetHitbox(std::sync::Mutex<Option<(f64, f64, f64, f64)>>);

#[tauri::command]
fn set_pet_hitbox(state: tauri::State<PetHitbox>, x: f64, y: f64, w: f64, h: f64) {
    if let Ok(mut hit) = state.0.lock() {
        *hit = Some((x, y, w, h));
    }
}

fn spawn_click_through_watcher(handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut ignoring: Option<bool> = None;
        loop {
            std::thread::sleep(std::time::Duration::from_millis(80));
            let Some(win) = handle.get_webview_window("main") else {
                continue;
            };
            if !win.is_visible().unwrap_or(false) {
                continue;
            }
            let (Ok(cursor), Ok(pos)) = (handle.cursor_position(), win.outer_position()) else {
                continue;
            };
            let scale = win.scale_factor().unwrap_or(1.0);
            let hitbox = handle
                .state::<PetHitbox>()
                .0
                .lock()
                .ok()
                .and_then(|guard| *guard);
            // Until the webview reports a hitbox, keep the whole window live.
            let inside = match hitbox {
                Some((hx, hy, hw, hh)) => {
                    let lx = (cursor.x - pos.x as f64) / scale;
                    let ly = (cursor.y - pos.y as f64) / scale;
                    lx >= hx && lx <= hx + hw && ly >= hy && ly <= hy + hh
                }
                None => true,
            };
            let want_ignore = !inside;
            if ignoring != Some(want_ignore)
                && win.set_ignore_cursor_events(want_ignore).is_ok()
            {
                ignoring = Some(want_ignore);
            }
        }
    });
}

// ── System sleep detection ──────────────────────────────────────────────────
// No OS sleep/wake API is used here (macOS's is Objective-C-only); instead a
// background thread sleeps in fixed steps and compares wall-clock time
// before/after. std::thread::sleep is itself suspended for the duration of a
// system sleep, so a step that took far longer than requested means the
// machine was asleep in between — the excess IS the sleep duration. A
// generous slack absorbs normal scheduler jitter without false-triggering.
const SLEEP_POLL: std::time::Duration = std::time::Duration::from_secs(3);
const SLEEP_SLACK: std::time::Duration = std::time::Duration::from_secs(10);

fn spawn_sleep_watcher(handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut last = std::time::SystemTime::now();
        loop {
            std::thread::sleep(SLEEP_POLL);
            let now = std::time::SystemTime::now();
            if let Ok(elapsed) = now.duration_since(last) {
                if elapsed > SLEEP_POLL + SLEEP_SLACK {
                    let ms = (elapsed - SLEEP_POLL).as_millis() as u64;
                    let _ = handle.emit("system-slept", ms);
                }
            }
            last = now;
        }
    });
}

// Webview consoles aren't visible when launched from a terminal; route
// diagnostics through stdout instead.
#[tauri::command]
fn log(msg: String) {
    println!("[webview] {msg}");
}

// ── Data directory ──────────────────────────────────────────────────────────
// All user data (save.json, addons/, pets/) lives under one root. By default
// that's the platform app-data dir; the user can relocate it from Settings →
// Storage, in which case a small pointer file (data-dir.txt) in the DEFAULT
// location records the custom root so it's found again at boot.
fn default_data_root(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("app data dir unavailable");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn data_root(app: &tauri::AppHandle) -> std::path::PathBuf {
    let default = default_data_root(app);
    if let Ok(custom) = std::fs::read_to_string(default.join("data-dir.txt")) {
        let path = std::path::PathBuf::from(custom.trim());
        if path.is_dir() {
            return path;
        }
    }
    default
}

/// Uploaded custom pet spritesheets live here.
fn pets_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = data_root(app).join("pets");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn dir_is_writable(dir: &std::path::Path) -> bool {
    if std::fs::create_dir_all(dir).is_err() {
        return false;
    }
    let probe = dir.join(".pikapet-write-test");
    let ok = std::fs::write(&probe, b"ok").is_ok();
    let _ = std::fs::remove_file(&probe);
    ok
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let to = dst.join(entry.file_name());
        if entry.path().is_dir() {
            copy_dir_all(&entry.path(), &to)?;
        } else {
            std::fs::copy(entry.path(), &to)?;
        }
    }
    Ok(())
}

#[tauri::command]
fn get_data_paths(app: tauri::AppHandle) -> serde_json::Value {
    let root = data_root(&app);
    serde_json::json!({
        "root": root.to_string_lossy(),
        "addons": root.join("addons").to_string_lossy(),
        "pets": root.join("pets").to_string_lossy(),
        "isDefault": root == default_data_root(&app),
    })
}

// Relocate the data root: validate the target, copy save.json + addons/ +
// pets/ over, delete the old copy (a true move), record the pointer, and
// restart the app so every window reopens against the new location.
#[tauri::command]
fn change_data_dir(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let new_root = std::path::PathBuf::from(path.trim());
    if !new_root.is_absolute() {
        return Err("pick an absolute folder path".into());
    }
    let current = data_root(&app);
    let default = default_data_root(&app);
    if new_root == current {
        return Err("that is already the data folder".into());
    }
    // Never inside the app itself (wiped on update), nor nested in/around the
    // current root (recursive copies and shadowed files).
    if let Ok(exe) = std::env::current_exe() {
        let app_dir = exe
            .ancestors()
            .find(|p| p.extension().is_some_and(|e| e == "app"))
            .map(std::path::Path::to_path_buf)
            .or_else(|| exe.parent().map(std::path::Path::to_path_buf));
        if let Some(app_dir) = app_dir {
            if new_root.starts_with(&app_dir) {
                return Err("that folder is inside the app itself — pick one outside".into());
            }
        }
    }
    if new_root.starts_with(&current) || current.starts_with(&new_root) {
        return Err("the new folder can't be inside the current data folder (or contain it)".into());
    }
    if !dir_is_writable(&new_root) {
        return Err("that folder is not writable — pick another one".into());
    }

    // Migrate everything that exists today, then remove the old copy. The
    // default root itself always survives (it hosts the pointer file).
    let save = current.join("save.json");
    if save.is_file() {
        std::fs::copy(&save, new_root.join("save.json")).map_err(|e| e.to_string())?;
    }
    for sub in ["addons", "pets"] {
        let from = current.join(sub);
        if from.is_dir() {
            copy_dir_all(&from, &new_root.join(sub)).map_err(|e| e.to_string())?;
        }
    }
    let _ = std::fs::remove_file(&save);
    for sub in ["addons", "pets"] {
        let _ = std::fs::remove_dir_all(current.join(sub));
    }
    if current != default {
        let _ = std::fs::remove_dir(&current); // only removed when now empty
    }

    if new_root == default {
        let _ = std::fs::remove_file(default.join("data-dir.txt"));
    } else {
        std::fs::write(default.join("data-dir.txt"), new_root.to_string_lossy().as_bytes())
            .map_err(|e| e.to_string())?;
    }
    app.restart();
}

// Magic Station "Create My Own Form": copy a user-picked spritesheet into
// <data-root>/pets/ under a fresh custom-form key. The form still has to be
// unlocked with coins afterwards (stats window owns that).
#[tauri::command]
fn import_custom_pet(app: tauri::AppHandle, path: String) -> Result<serde_json::Value, String> {
    let src = std::path::PathBuf::from(&path);
    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_lowercase)
        .unwrap_or_default();
    if !matches!(ext.as_str(), "webp" | "png") {
        return Err("pick a .webp or .png spritesheet".into());
    }
    let stem = src
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("custom")
        .to_string();
    let key = format!(
        "custom-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let file = format!("{key}.{ext}");
    std::fs::copy(&src, pets_dir(&app).join(&file)).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "key": key, "file": file, "name": stem }))
}

// ── Extension management ───────────────────────────────────────────────────────
// Extensions live as folders under <data-root>/addons/<id>/ with a manifest.json.
// (The on-disk folder keeps its historical "addons" name so existing installs
// keep working.) Install = extract a zip there; uninstall = delete the folder.
fn extensions_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = data_root(app).join("addons");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn valid_extension_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 40
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

#[tauri::command]
fn install_extension(app: tauri::AppHandle, path: String) -> Result<serde_json::Value, String> {
    let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    install_archive(&app, file)
}

// Marketplace installs: download the release-asset zip, then extract it
// exactly like a local zip install.
#[tauri::command]
fn install_extension_from_url(app: tauri::AppHandle, url: String) -> Result<serde_json::Value, String> {
    use std::io::Read;
    if !url.starts_with("https://") {
        return Err("only https downloads are allowed".into());
    }
    let mut bytes = Vec::new();
    ureq::get(&url)
        .call()
        .map_err(|e| e.to_string())?
        .into_reader()
        .take(20 * 1024 * 1024) // sanity cap: no extension is anywhere near 20 MB
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    install_archive(&app, std::io::Cursor::new(bytes))
}

fn install_archive<R: std::io::Read + std::io::Seek>(
    app: &tauri::AppHandle,
    reader: R,
) -> Result<serde_json::Value, String> {
    use std::io::Read;
    let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;

    // Find manifest.json at the zip root or inside a single top-level folder.
    let mut manifest_entry: Option<(usize, String)> = None;
    for i in 0..archive.len() {
        let name = archive
            .by_index(i)
            .map_err(|e| e.to_string())?
            .name()
            .trim_start_matches("./")
            .to_string();
        if name.ends_with("manifest.json") && name.matches('/').count() <= 1 {
            manifest_entry = Some((i, name));
            break;
        }
    }
    let (idx, manifest_path) = manifest_entry.ok_or("no manifest.json found in the zip")?;
    let mut manifest_str = String::new();
    archive
        .by_index(idx)
        .map_err(|e| e.to_string())?
        .read_to_string(&mut manifest_str)
        .map_err(|e| e.to_string())?;
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest_str).map_err(|e| format!("bad manifest: {e}"))?;
    let id = manifest
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("manifest is missing \"id\"")?
        .to_string();
    if !valid_extension_id(&id) {
        return Err("invalid extension id (use letters, digits, - or _)".into());
    }

    // Extract everything that shares the manifest's folder prefix.
    let prefix = manifest_path.trim_end_matches("manifest.json").to_string();
    let dest = extensions_dir(app).join(&id);
    let _ = std::fs::remove_dir_all(&dest);
    std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        if entry.is_dir() {
            continue;
        }
        let name = entry.name().trim_start_matches("./").to_string();
        if !name.starts_with(&prefix) {
            continue;
        }
        let rel = &name[prefix.len()..];
        if rel.is_empty() || rel.split('/').any(|part| part == "..") {
            continue;
        }
        let out = dest.join(rel);
        if let Some(parent) = out.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut buf = Vec::new();
        entry.read_to_end(&mut buf).map_err(|e| e.to_string())?;
        std::fs::write(&out, buf).map_err(|e| e.to_string())?;
    }
    Ok(manifest)
}

#[tauri::command]
fn uninstall_extension(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if !valid_extension_id(&id) {
        return Err("invalid extension id".into());
    }
    std::fs::remove_dir_all(extensions_dir(&app).join(&id)).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_installed_extensions(app: tauri::AppHandle) -> Vec<serde_json::Value> {
    let mut out = Vec::new();
    if let Ok(entries) = std::fs::read_dir(extensions_dir(&app)) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            if let Ok(s) = std::fs::read_to_string(path.join("manifest.json")) {
                if let Ok(mut manifest) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(obj) = manifest.as_object_mut() {
                        obj.insert(
                            "dir".into(),
                            serde_json::Value::String(path.to_string_lossy().into_owned()),
                        );
                    }
                    out.push(manifest);
                }
            }
        }
    }
    out.sort_by_key(|m| m.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string());
    out
}

// Keep-awake (Caffeine extension): while enabled, a `caffeinate -di` child
// process holds display + idle sleep assertions. `-w <our pid>` ties the
// child's lifetime to this app, so sleep behavior always returns to normal
// when the app quits — even on a force quit.
struct KeepAwake(std::sync::Mutex<Option<std::process::Child>>);

#[tauri::command]
fn set_keep_awake(state: tauri::State<KeepAwake>, on: bool) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        let mut child = state.0.lock().map_err(|e| e.to_string())?;
        if on {
            if child.is_none() {
                *child = Some(
                    std::process::Command::new("/usr/bin/caffeinate")
                        .args(["-di", "-w", &std::process::id().to_string()])
                        .spawn()
                        .map_err(|e| e.to_string())?,
                );
            }
        } else if let Some(mut c) = child.take() {
            let _ = c.kill();
            let _ = c.wait();
        }
        Ok(child.is_some())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (state, on);
        Err("keep-awake is not supported on this platform yet".into())
    }
}

#[tauri::command]
fn keep_awake_status(state: tauri::State<KeepAwake>) -> bool {
    let mut child = match state.0.lock() {
        Ok(guard) => guard,
        Err(_) => return false,
    };
    // Reap a child that died behind our back (e.g. killed externally).
    if let Some(c) = child.as_mut() {
        if !matches!(c.try_wait(), Ok(None)) {
            *child = None;
        }
    }
    child.is_some()
}

// Extension push notifications, sent through the system notification center.
// osascript works from a bare debug binary (no signed .app bundle needed).
#[tauri::command]
fn notify(title: String, body: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let quote = |s: &str| format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""));
        std::process::Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "display notification {} with title {}",
                quote(&body),
                quote(&title)
            ))
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (title, body);
        Err("notifications are not supported on this platform yet".into())
    }
}

// Extension popup windows: a native window per extension, loading the
// addon-window.html shell which iframes the requested page from the extension's
// folder and provides the same postMessage bridge as the hub.
#[tauri::command]
fn open_extension_window(
    app: tauri::AppHandle,
    id: String,
    page: String,
    width: f64,
    height: f64,
    title: String,
) -> Result<(), String> {
    if !valid_extension_id(&id) {
        return Err("invalid extension id".into());
    }
    if page.is_empty() || page.contains("..") || page.starts_with('/') {
        return Err("invalid page path".into());
    }
    if !extensions_dir(&app).join(&id).join(&page).is_file() {
        return Err(format!("no such page in extension \"{id}\": {page}"));
    }
    // Historical label prefix; must match the "addon-*" windows entry in
    // capabilities/default.json.
    let label = format!("addon-{id}");
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }
    let encode = |s: &str| -> String {
        s.bytes()
            .map(|b| match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'/' => {
                    (b as char).to_string()
                }
                _ => format!("%{b:02X}"),
            })
            .collect()
    };
    let url = format!("addon-window.html?id={}&page={}", encode(&id), encode(&page));
    tauri::WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::App(url.into()))
        .title(if title.is_empty() { &id } else { &title })
        .inner_size(width.clamp(240.0, 1400.0), height.clamp(160.0, 1000.0))
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Music extension: list audio files under a folder (2 levels deep, capped).
fn collect_music(dir: &std::path::Path, depth: u32, out: &mut Vec<String>) {
    if depth > 2 || out.len() >= 500 {
        return;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_music(&path, depth + 1, out);
            } else if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if matches!(
                    ext.to_lowercase().as_str(),
                    "mp3" | "m4a" | "aac" | "wav" | "flac" | "ogg"
                ) {
                    if let Some(s) = path.to_str() {
                        out.push(s.to_string());
                    }
                }
            }
        }
    }
}

#[tauri::command]
fn list_music(dir: String) -> Vec<String> {
    let expanded = if let Some(rest) = dir.strip_prefix("~/") {
        std::env::var_os("HOME")
            .map(|h| std::path::PathBuf::from(h).join(rest))
            .unwrap_or_else(|| std::path::PathBuf::from(&dir))
    } else {
        std::path::PathBuf::from(&dir)
    };
    let mut out = Vec::new();
    collect_music(&expanded, 0, &mut out);
    out.sort();
    out
}

// Shows one of the pre-declared auxiliary windows (they hide on close).
#[tauri::command]
fn show_window(app: tauri::AppHandle, label: String) {
    if label != "hub" {
        return;
    }
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn position_bottom_right(win: &tauri::WebviewWindow) {
    if let (Ok(Some(monitor)), Ok(size)) = (win.current_monitor(), win.outer_size()) {
        let area = monitor.work_area();
        let margin = (16.0 * monitor.scale_factor()) as i32;
        let x = area.position.x + area.size.width as i32 - size.width as i32 - margin;
        let y = area.position.y + area.size.height as i32 - size.height as i32 - margin;
        let _ = win.set_position(tauri::PhysicalPosition::new(x, y));
    }
}

// First-run setup finished: reveal the pet, dismiss the setup window.
#[tauri::command]
fn finish_setup(app: tauri::AppHandle) {
    if let Some(setup) = app.get_webview_window("setup") {
        let _ = setup.hide();
    }
    if let Some(main) = app.get_webview_window("main") {
        position_bottom_right(&main);
        let _ = main.show();
    }
}

// Wipe all user data and restart into the first-run experience.
#[tauri::command]
fn reset_app(app: tauri::AppHandle) {
    let _ = std::fs::remove_file(save_path(&app));
    app.restart();
}

fn save_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    data_root(app).join("save.json")
}

#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Option<String> {
    std::fs::read_to_string(save_path(&app)).ok()
}

#[tauri::command]
fn save_state(app: tauri::AppHandle, state: String) -> Result<(), String> {
    std::fs::write(save_path(&app), state).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(KeepAwake(std::sync::Mutex::new(None)))
        .manage(PetHitbox(std::sync::Mutex::new(None)))
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Keep the pet out of the macOS Dock; it lives on the desktop only.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // First run (no save file): show the pet-selection window instead
            // of the pet. Otherwise spawn the pet where it last stood; if that
            // spot is (partly) off-screen or unknown, fall back to the
            // bottom-right corner above the Dock / taskbar.
            let first_run = !save_path(app.handle()).exists();
            if first_run {
                if let Some(setup) = app.get_webview_window("setup") {
                    let _ = setup.show();
                    let _ = setup.set_focus();
                }
            } else if let Some(main) = app.get_webview_window("main") {
                let saved_pos = std::fs::read_to_string(save_path(app.handle()))
                    .ok()
                    .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                    .and_then(|v| {
                        let w = v.get("window")?;
                        Some((w.get("x")?.as_i64()? as i32, w.get("y")?.as_i64()? as i32))
                    });

                let mut placed = false;
                if let (Some((x, y)), Ok(size), Ok(monitors)) =
                    (saved_pos, main.outer_size(), main.available_monitors())
                {
                    let on_screen = monitors.iter().any(|m| {
                        let mp = m.position();
                        let ms = m.size();
                        x >= mp.x
                            && y >= mp.y
                            && x + size.width as i32 <= mp.x + ms.width as i32
                            && y + size.height as i32 <= mp.y + ms.height as i32
                    });
                    if on_screen {
                        let _ = main.set_position(tauri::PhysicalPosition::new(x, y));
                        placed = true;
                    }
                }
                if !placed {
                    position_bottom_right(&main);
                }
                let _ = main.show();
            }

            // Desktop clicks pass through the pet window's transparent margins.
            spawn_click_through_watcher(app.handle().clone());
            spawn_sleep_watcher(app.handle().clone());

            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let tray_menu = MenuBuilder::new(app).item(&quit_item).build()?;

            TrayIconBuilder::with_id("main-tray")
                .icon(tauri::include_image!("icons/tray.png"))
                .icon_as_template(true)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id().as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    // Feeds tray geometry to the positioner so TrayBottomCenter works.
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(stats) = app.get_webview_window("stats") {
                            if stats.is_visible().unwrap_or(false) {
                                let _ = stats.hide();
                            } else {
                                let _ = stats.move_window(Position::TrayBottomCenter);
                                let _ = stats.show();
                                let _ = stats.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match (window.label(), event) {
            // The stats panel behaves like a popover: clicking anywhere else closes it.
            ("stats", tauri::WindowEvent::Focused(false)) => {
                let _ = window.hide();
            }
            // Closing the hub only hides it, so it can reopen later.
            ("hub", tauri::WindowEvent::CloseRequested { api, .. }) => {
                api.prevent_close();
                let _ = window.hide();
            }
            // Closing the first-run setup window quits (nothing else to do).
            ("setup", tauri::WindowEvent::CloseRequested { .. }) => {
                window.app_handle().exit(0);
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            quit,
            set_pet_hitbox,
            show_window,
            finish_setup,
            reset_app,
            load_state,
            save_state,
            get_data_paths,
            change_data_dir,
            import_custom_pet,
            list_music,
            install_extension,
            install_extension_from_url,
            uninstall_extension,
            list_installed_extensions,
            notify,
            open_extension_window,
            set_keep_awake,
            keep_awake_status,
            log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
