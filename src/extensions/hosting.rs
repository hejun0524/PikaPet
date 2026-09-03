// Creates/repositions/hides the real Tauri child webview each installed
// extension's main page now runs in (replacing the old sandboxed
// `<iframe>` inside the hub's own webview). The webview's top-level URL is
// the extension's *own* entry file, served via the asset protocol — not a
// shell page with a nested iframe, which would recreate today's problem:
// `withGlobalTauri` only injects `window.__TAURI__` into a webview's own
// top document, never into anything nested inside an iframe within it.

use super::bridge::init_script;
use tauri::Manager;

/// `convertFileSrc`'s exact JS-side algorithm (see
/// `tauri-2.11.5/scripts/core.js`) has no Rust-side equivalent function to
/// call — this hand-builds the same `asset://localhost/<percent-encoded-path>`
/// URL byte-for-byte, matching `encodeURIComponent`'s unreserved-character
/// set exactly (this app targets macOS only, so there's no Windows/Android
/// `https://asset.localhost/…` variant to also produce).
fn asset_url(path: &std::path::Path) -> Result<tauri::Url, String> {
    let mut encoded = String::new();
    for b in path.to_string_lossy().bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'!' | b'~' | b'*' | b'\'' | b'(' | b')' => {
                encoded.push(b as char);
            }
            _ => encoded.push_str(&format!("%{b:02X}")),
        }
    }
    tauri::Url::parse(&format!("asset://localhost/{encoded}")).map_err(|e| e.to_string())
}

/// Creates (if not already open) or repositions/shows (if already open)
/// the extension's child webview inside the hub window, at the exact
/// on-screen bounds of `#extension-host` — the hub computes that rect
/// itself (flex layout Rust can't know about) and passes it in pixels.
#[tauri::command]
pub fn open_extension_webview(
    app: tauri::AppHandle,
    id: String,
    entry: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if !super::valid_extension_id(&id) {
        return Err("invalid extension id".into());
    }
    let label = format!("ext-{id}");
    let position = tauri::LogicalPosition::new(x, y);
    let size = tauri::LogicalSize::new(width.max(1.0), height.max(1.0));

    if let Some(webview) = app.get_webview(&label) {
        webview.set_position(position).map_err(|e| e.to_string())?;
        webview.set_size(size).map_err(|e| e.to_string())?;
        webview.show().map_err(|e| e.to_string())?;
        return Ok(());
    }

    if entry.is_empty() || entry.contains("..") || entry.starts_with('/') {
        return Err("invalid entry path".into());
    }
    let entry_path = super::extensions_dir(&app).join(&id).join(&entry);
    if !entry_path.is_file() {
        return Err(format!("no such entry page in extension \"{id}\": {entry}"));
    }

    let hub = app.get_window("hub").ok_or("hub window not found")?;
    let network_fetch_granted = super::declared_permissions(&app, &id).iter().any(|p| p == "network:fetch");
    // `focused(false)`: a child webview defaults to stealing keyboard/input
    // focus from the parent the moment it's created (wry's own default is
    // `focused: true`, confirmed by reading wry-0.55.1's WebViewAttributes;
    // Tauri's WebviewBuilder just forwards it) — the leading suspect for
    // the hub's topbar buttons (← Back to Extensions, Settings, …) not
    // responding to a click once an extension page is open: JS click
    // handlers and the native frame geometry both check out correctly
    // (verified live), so a stuck responder/focus handoff between the two
    // webviews sharing this window is what's left. Tauri doesn't expose
    // wry's lower-level `focus_parent()`, so not grabbing focus in the
    // first place is the only lever available here — not yet confirmed
    // live to fully fix the click issue (needs a real click to verify).

    let builder = tauri::webview::WebviewBuilder::new(&label, tauri::WebviewUrl::External(asset_url(&entry_path)?))
        .initialization_script(init_script(network_fetch_granted))
        .focused(false);
    hub.add_child(builder, position, size).map_err(|e| e.to_string())?;
    Ok(())
}

/// Hides (not closes) an open extension's child webview — matches the old
/// `.extension-frame.bg { display: none }` behavior: the webview keeps
/// running (confirmed by a throwaway spike: a resized-to-zero child
/// webview's JS timers never paused), it's just off-screen while another
/// extension or hub view is active.
#[tauri::command]
pub fn hide_extension_webview(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&format!("ext-{id}")) {
        webview.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Destroys an extension's child webview outright — used on uninstall, so
/// a freshly (re)installed extension with the same id never inherits a
/// stale webview instance.
#[tauri::command]
pub fn close_extension_webview(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&format!("ext-{id}")) {
        webview.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
