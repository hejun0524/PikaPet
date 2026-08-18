// Marketplace registry: fetches `registry.json` from a GitHub Releases
// **asset** URL — not `api.github.com` (unauthenticated calls are rate
// limited) and not `raw.githubusercontent.com` — release assets are served
// through GitHub's release CDN, the same mechanism the Tauri updater itself
// uses, so it's the one that scales to every user's app polling it
// repeatedly. Falls back to a disk cache on any fetch failure so the
// marketplace is never blank just because the network call failed.

use serde::{Deserialize, Serialize};
use std::io::Read;
use std::sync::Mutex;

/// This value changes at release cadence (whoever owns the registry repo
/// is the app's maintainer, not something an end user would configure),
/// so it lives as a Rust const rather than in `tauri.conf.json` — mirrors
/// where it already lived as a JS const in the old `marketplace.js`.
const MARKETPLACE_REPO: &str = "hejun0524/PikaPet-Extensions";
const MARKETPLACE_TAG: &str = "latest";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryEntry {
    pub id: String,
    pub version: String,
    pub url: String,
    pub sha256: String,
    pub signature: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    // Cheap fallback art for the marketplace card — the same emoji already
    // in the extension's own extension.json, so publishing it here is just
    // copying a value that already exists rather than hosting a new asset.
    // `icon` (an actual image URL) still wins if both are present.
    #[serde(default)]
    pub emoji: Option<String>,
    // Not in the original minimal registry.json shape — added so the
    // marketplace can show a permission prompt *before* downloading
    // anything (matching the install-time prompt for local sideloads).
    // Optional/defaulted so a bare-minimum registry.json (no permissions
    // field at all) still parses; an omitted list just means the prompt
    // shows no permissions, not that the install is unchecked — the real
    // enforcement is still `extension.json`'s own declared permissions,
    // checked again at install time regardless of what the registry said.
    #[serde(default)]
    pub permissions: Vec<String>,
}

/// The on-the-wire (and on-disk-cache) shape: `{"extensions": [...]}`. Used
/// for every read AND write of this shape — the disk cache is written in
/// exactly the same form it's read back in, on purpose: a previous version
/// of this module wrote a bare array while `parse_registry` (below) only
/// ever accepted the wrapped object, so a cache written by a successful
/// fetch could never be read back by a later fallback. Caught live, not by
/// any unit test — routing both directions through this one struct is what
/// makes that class of bug structurally impossible to reintroduce.
#[derive(Debug, Serialize, Deserialize)]
struct RegistryFile {
    extensions: Vec<RegistryEntry>,
}

/// In-memory cache for the lifetime of the process — the frontend already
/// controls *when* to refetch (manual refresh, focus, online events; see
/// the plan's step 8), so this needs no TTL of its own.
#[derive(Default)]
pub struct RegistryState(pub Mutex<Option<Vec<RegistryEntry>>>);

fn cache_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    // Sibling to extensions/, pets/, save.json under the data root — but
    // deliberately NOT added to `change_data_dir`'s copy-list in main.rs:
    // it's a disposable cache, not user data, so a relocation should just
    // trigger one clean refetch rather than carrying stale content forward.
    crate::data_root(app).join("registry-cache.json")
}

/// Parses a `registry.json` payload (or an on-disk cache file — same
/// shape) into its extension list. Split out from the network fetch so
/// it's testable without any HTTP call.
fn parse_registry(bytes: &[u8]) -> Result<Vec<RegistryEntry>, String> {
    let file: RegistryFile = serde_json::from_slice(bytes).map_err(|e| format!("bad registry.json: {e}"))?;
    Ok(file.extensions)
}

fn write_cache(app: &tauri::AppHandle, entries: &[RegistryEntry]) {
    let file = RegistryFile { extensions: entries.to_vec() };
    if let Ok(serialized) = serde_json::to_string(&file) {
        let _ = std::fs::write(cache_path(app), serialized);
    }
}

fn fetch_fresh() -> Result<Vec<RegistryEntry>, String> {
    let url = format!("https://github.com/{MARKETPLACE_REPO}/releases/download/{MARKETPLACE_TAG}/registry.json");
    let mut body = Vec::new();
    ureq::get(&url)
        .call()
        .map_err(|e| e.to_string())?
        .into_reader()
        .read_to_end(&mut body)
        .map_err(|e| e.to_string())?;
    parse_registry(&body)
}

/// Fetches the marketplace registry: an in-memory hit first (unless
/// `force`), then a live fetch, then — only if that fails — the disk
/// cache, tagged `"stale": true`. Only a genuine error (no live fetch and
/// no disk cache either) surfaces as `Err`; everything else is `Ok` so the
/// frontend can always render *something* rather than a blank tab.
#[tauri::command]
pub fn fetch_registry(
    app: tauri::AppHandle,
    state: tauri::State<RegistryState>,
    force: bool,
) -> Result<serde_json::Value, String> {
    if !force {
        if let Ok(guard) = state.0.lock() {
            if let Some(entries) = guard.as_ref() {
                return Ok(serde_json::json!({ "extensions": entries, "stale": false }));
            }
        }
    }

    match fetch_fresh() {
        Ok(entries) => {
            write_cache(&app, &entries);
            if let Ok(mut guard) = state.0.lock() {
                *guard = Some(entries.clone());
            }
            Ok(serde_json::json!({ "extensions": entries, "stale": false }))
        }
        Err(fetch_err) => {
            let cached = std::fs::read(cache_path(&app)).ok().and_then(|bytes| parse_registry(&bytes).ok());
            match cached {
                Some(entries) => Ok(serde_json::json!({ "extensions": entries, "stale": true })),
                None => Err(fetch_err),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_registry_json() {
        let json = br#"{"extensions":[{"id":"thing","version":"1.0.0","url":"https://github.com/x/y/releases/download/v1/thing.zip","sha256":"abc","signature":"def","name":"Thing"}]}"#;
        let entries = parse_registry(json).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, "thing");
        assert_eq!(entries[0].description, None);
    }

    #[test]
    fn parses_optional_fields() {
        let json = br#"{"extensions":[{"id":"thing","version":"1.0.0","url":"u","sha256":"s","signature":"sig","name":"Thing","description":"desc","icon":"icon.png"}]}"#;
        let entries = parse_registry(json).unwrap();
        assert_eq!(entries[0].description, Some("desc".to_string()));
        assert_eq!(entries[0].icon, Some("icon.png".to_string()));
    }

    #[test]
    fn rejects_malformed_json() {
        assert!(parse_registry(b"not json").is_err());
        assert!(parse_registry(br#"{"not_extensions": []}"#).is_err());
    }

    #[test]
    fn empty_extensions_list_is_valid() {
        let entries = parse_registry(br#"{"extensions":[]}"#).unwrap();
        assert!(entries.is_empty());
    }

    // Regression test for a real bug caught only through live testing: the
    // disk cache was once written as a bare `[...]` array while
    // `parse_registry` only ever accepted `{"extensions": [...]}`, so a
    // cache written by a successful fetch could never be read back by a
    // later fallback. `write_cache`'s actual disk I/O needs a real
    // AppHandle, but the bug was entirely in the *shape* mismatch, so
    // exercising `RegistryFile`'s own serialize→parse round trip (the
    // exact shape `write_cache` now serializes) is what would catch it
    // again if reintroduced.
    #[test]
    fn cache_file_shape_round_trips_through_parse_registry() {
        let entries = vec![RegistryEntry {
            id: "thing".into(),
            version: "1.0.0".into(),
            url: "https://example.com/thing.zip".into(),
            sha256: "abc".into(),
            signature: "def".into(),
            name: "Thing".into(),
            description: None,
            icon: None,
            emoji: Some("🧪".into()),
            permissions: vec!["notifications:show".to_string()],
        }];
        let file = RegistryFile { extensions: entries.clone() };
        let serialized = serde_json::to_string(&file).unwrap();
        let parsed = parse_registry(serialized.as_bytes()).unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].id, entries[0].id);
    }
}
