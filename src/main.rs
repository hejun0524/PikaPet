#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[tauri::command]
fn quit(app: tauri::AppHandle) {
    app.exit(0);
}

// Webview consoles aren't visible when launched from a terminal; route
// diagnostics through stdout instead.
#[tauri::command]
fn log(msg: String) {
    println!("[webview] {msg}");
}

// ── Add-on management ───────────────────────────────────────────────────────
// Add-ons live as folders under <app-data>/addons/<id>/ with a manifest.json.
// Install = extract a zip there; uninstall = delete the folder.
fn addons_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("app data dir unavailable")
        .join("addons");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn valid_addon_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 40
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

#[tauri::command]
fn install_addon(app: tauri::AppHandle, path: String) -> Result<serde_json::Value, String> {
    use std::io::Read;
    let file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

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
    if !valid_addon_id(&id) {
        return Err("invalid add-on id (use letters, digits, - or _)".into());
    }

    // Extract everything that shares the manifest's folder prefix.
    let prefix = manifest_path.trim_end_matches("manifest.json").to_string();
    let dest = addons_dir(&app).join(&id);
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
fn uninstall_addon(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if !valid_addon_id(&id) {
        return Err("invalid add-on id".into());
    }
    std::fs::remove_dir_all(addons_dir(&app).join(&id)).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_installed_addons(app: tauri::AppHandle) -> Vec<serde_json::Value> {
    let mut out = Vec::new();
    if let Ok(entries) = std::fs::read_dir(addons_dir(&app)) {
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

// Add-on push notifications, sent through the system notification center.
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

// Add-on popup windows: a native window per add-on, loading the
// addon-window.html shell which iframes the requested page from the add-on's
// folder and provides the same postMessage bridge as the hub.
#[tauri::command]
fn open_addon_window(
    app: tauri::AppHandle,
    id: String,
    page: String,
    width: f64,
    height: f64,
    title: String,
) -> Result<(), String> {
    if !valid_addon_id(&id) {
        return Err("invalid add-on id".into());
    }
    if page.is_empty() || page.contains("..") || page.starts_with('/') {
        return Err("invalid page path".into());
    }
    if !addons_dir(&app).join(&id).join(&page).is_file() {
        return Err(format!("no such page in add-on \"{id}\": {page}"));
    }
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

// Music add-on: list audio files under a folder (2 levels deep, capped).
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
    let dir = app
        .path()
        .app_data_dir()
        .expect("app data dir unavailable");
    let _ = std::fs::create_dir_all(&dir);
    dir.join("save.json")
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
            show_window,
            finish_setup,
            reset_app,
            load_state,
            save_state,
            list_music,
            install_addon,
            uninstall_addon,
            list_installed_addons,
            notify,
            open_addon_window,
            log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
