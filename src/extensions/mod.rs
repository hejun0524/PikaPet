pub mod bridge;
pub mod capability;
pub mod hosting;
pub mod install;
pub mod manifest;
pub mod migration;
pub mod registry;
// The actual implementation lives in the Tauri-free lib module
// `src/signing.rs` (see src/lib.rs) so `src/bin/sign-extension.rs` can
// depend on the exact same code instead of a second, drift-prone copy.
pub use mypetgame::signing;

/// Extensions live as folders under <data-root>/extensions/<id>/.
pub fn extensions_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = crate::data_root(app).join("extensions");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

pub fn valid_extension_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 40
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// Reads one installed extension's declared `permissions` straight from
/// its manifest on disk (`extension.json`, falling back to the legacy
/// `manifest.json`) — never trusted from a client-supplied parameter, so
/// callers needing "what is this extension actually allowed to do" always
/// get the on-disk truth rather than whatever the frontend claims.
pub fn declared_permissions(app: &tauri::AppHandle, id: &str) -> Vec<String> {
    let dir = extensions_dir(app).join(id);
    let manifest_str =
        std::fs::read_to_string(dir.join("extension.json")).or_else(|_| std::fs::read_to_string(dir.join("manifest.json")));
    manifest_str
        .ok()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        .and_then(|v| v.get("permissions").and_then(|p| p.as_array()).cloned())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
        .unwrap_or_default()
}
