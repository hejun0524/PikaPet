// Extension install/uninstall/list. Supersedes the old, unvalidated
// manifest.json-and-extract pipeline: every install now requires the new
// extension.json schema (see `manifest.rs`) and, for marketplace installs,
// a verified signature (see `crate::signing`) — nothing is written to disk
// until signature verification (if requested) and manifest validation both
// succeed.
//
// Local zip installs (the "Install extension from zip…" button, gated
// behind Settings → Developer mode → allowSideload) always skip signature
// verification: there is no registry entry to check a local file against.
// They still go through the exact same manifest/permission validation and
// extraction code as a verified install.

use super::{extensions_dir, manifest, valid_extension_id};
use std::io::Read;
use tauri::Manager;

#[tauri::command]
pub fn install_extension(app: tauri::AppHandle, path: String) -> Result<serde_json::Value, String> {
    let zip_bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let manifest = install_archive(&extensions_dir(&app), zip_bytes, None)?;
    register_capability_or_rollback(&app, &manifest)?;
    Ok(manifest)
}

/// Marketplace installs: looks up `entry_id` in the registry (a fresh fetch
/// if needed, but normally the cache `fetch_registry` already populated),
/// downloads its `url`, and verifies the download against *that entry's*
/// `sha256`/`signature` before extracting — never a caller-supplied URL,
/// so every marketplace install is forced through the registry's signed
/// metadata rather than an arbitrary string an extension or bug could hand
/// in.
#[tauri::command]
pub fn install_extension_from_registry(
    app: tauri::AppHandle,
    registry_state: tauri::State<super::registry::RegistryState>,
    entry_id: String,
) -> Result<serde_json::Value, String> {
    let registry = super::registry::fetch_registry(app.clone(), registry_state, false)?;
    let entries = registry
        .get("extensions")
        .and_then(|v| v.as_array())
        .ok_or("registry unavailable")?;
    let entry = entries
        .iter()
        .find(|e| e.get("id").and_then(|v| v.as_str()) == Some(entry_id.as_str()))
        .ok_or_else(|| format!("no such extension in the registry: {entry_id}"))?;
    let url = entry.get("url").and_then(|v| v.as_str()).ok_or("registry entry missing url")?;
    let sha256 = entry.get("sha256").and_then(|v| v.as_str()).ok_or("registry entry missing sha256")?;
    let signature = entry
        .get("signature")
        .and_then(|v| v.as_str())
        .ok_or("registry entry missing signature")?;

    let zip_bytes = download_zip(url)?;
    let manifest = install_archive(&extensions_dir(&app), zip_bytes, Some((sha256, signature)))?;
    register_capability_or_rollback(&app, &manifest)?;
    Ok(manifest)
}

fn download_zip(url: &str) -> Result<Vec<u8>, String> {
    if !url.starts_with("https://") {
        return Err("only https downloads are allowed".into());
    }
    let mut zip_bytes = Vec::new();
    ureq::get(url)
        .call()
        .map_err(|e| e.to_string())?
        .into_reader()
        .take(20 * 1024 * 1024) // sanity cap: no extension is anywhere near 20 MB
        .read_to_end(&mut zip_bytes)
        .map_err(|e| e.to_string())?;
    Ok(zip_bytes)
}

/// Registers the newly installed extension's capability (both the future
/// child-webview label and today's popup-window label — see
/// `capability.rs`). If registration fails, the just-extracted directory
/// is removed so an install never completes without its permission grant
/// existing — better to fail the install than to leave an ungoverned
/// extension on disk.
fn register_capability_or_rollback(app: &tauri::AppHandle, manifest: &serde_json::Value) -> Result<(), String> {
    let id = manifest
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("manifest is missing \"id\"")?
        .to_string();
    let permissions: Vec<String> = manifest
        .get("permissions")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
        .unwrap_or_default();

    let registered = super::capability::build_and_register(app, &id, &format!("ext-{id}"), &permissions).and_then(
        |_| super::capability::build_and_register_for_window(app, &id, &format!("extension-{id}"), &permissions),
    );
    if let Err(e) = registered {
        let _ = std::fs::remove_dir_all(extensions_dir(app).join(&id));
        return Err(format!("failed to register extension capability: {e}"));
    }
    Ok(())
}

/// Verifies (if `expected` is `Some`) then unzips `zip_bytes` into
/// `<extensions_root>/<id>/`. `expected` carries a registry-sourced
/// `(sha256_hex, signature_b64)` pair; local sideloads pass `None` since
/// there is nothing to verify a local file against.
///
/// Takes the destination root directly rather than an `AppHandle` — the
/// only reason this ever needed Tauri was to resolve that one path, so
/// hoisting that resolution to the caller keeps the actual archive
/// validation/extraction logic (the security-sensitive part) testable
/// without a Tauri runtime at all.
pub fn install_archive(
    extensions_root: &std::path::Path,
    zip_bytes: Vec<u8>,
    expected: Option<(&str, &str)>,
) -> Result<serde_json::Value, String> {
    if let Some((sha256, signature)) = expected {
        crate::extensions::signing::verify(&zip_bytes, sha256, signature)?;
    }

    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(zip_bytes)).map_err(|e| e.to_string())?;

    // Find extension.json at the zip root or inside a single top-level
    // folder. A zip with only the old manifest.json is a hard install
    // error here — the legacy format is only ever tolerated for
    // extensions already on disk from before this manifest existed (see
    // `migration.rs`), never for a fresh install.
    let mut manifest_entry: Option<(usize, String)> = None;
    for i in 0..archive.len() {
        let name = archive
            .by_index(i)
            .map_err(|e| e.to_string())?
            .name()
            .trim_start_matches("./")
            .to_string();
        if name.ends_with("extension.json") && name.matches('/').count() <= 1 {
            manifest_entry = Some((i, name));
            break;
        }
    }
    let (idx, manifest_path) = manifest_entry.ok_or(
        "no extension.json found in the zip \u{2014} extensions using the old manifest.json \
         format can't be installed this way; ask the author to update it",
    )?;
    let mut manifest_str = String::new();
    archive
        .by_index(idx)
        .map_err(|e| e.to_string())?
        .read_to_string(&mut manifest_str)
        .map_err(|e| e.to_string())?;
    let parsed = manifest::parse_and_validate(manifest_str.as_bytes())?;

    // Extract everything that shares the manifest's folder prefix.
    let prefix = manifest_path.trim_end_matches("extension.json").to_string();
    let dest = extensions_root.join(&parsed.id);
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

    serde_json::to_value(&parsed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn uninstall_extension(app: tauri::AppHandle, id: String) -> Result<(), String> {
    if !valid_extension_id(&id) {
        return Err("invalid extension id".into());
    }
    // Destroy any open surface first — a stale webview/window left running
    // after its files are gone would be reaching for a directory that no
    // longer exists. (The dynamically-registered capability itself can't
    // be revoked — see `capability.rs`'s doc comment — but with no
    // surface left to invoke anything, that's moot until a reinstall.)
    let _ = super::hosting::close_extension_webview(app.clone(), id.clone());
    if let Some(win) = app.get_webview_window(&format!("extension-{id}")) {
        let _ = win.close();
    }
    std::fs::remove_dir_all(extensions_dir(&app).join(&id)).map_err(|e| e.to_string())
}

/// Lists installed extensions, reading the new `extension.json` first and
/// falling back to the old `manifest.json` for extensions installed before
/// this manifest existed. Legacy installs (no `extension.json`) are
/// tagged `"legacy": true` and have their `permissions` field overwritten
/// with the full catalog (see `migration.rs`) — the single source of
/// truth both the Manager tab's "unverified" badge and
/// `capability::register_all_at_boot`'s boot-time grant read from, so
/// there's exactly one place that decides a legacy extension's trust
/// level rather than two that could drift apart.
#[tauri::command]
pub fn list_installed_extensions(app: tauri::AppHandle) -> Vec<serde_json::Value> {
    let mut out = Vec::new();
    if let Ok(entries) = std::fs::read_dir(extensions_dir(&app)) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            // The directory name is always the extension's id, by
            // construction (install_archive extracts to
            // extensions_dir/<id>/) — read it from the path rather than
            // the manifest body, which avoids borrowing `manifest`
            // immutably while `as_object_mut()` holds it mutably below.
            let dir_id = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            let manifest_str = std::fs::read_to_string(path.join("extension.json"))
                .or_else(|_| std::fs::read_to_string(path.join("manifest.json")));
            if let Ok(s) = manifest_str {
                if let Ok(mut manifest) = serde_json::from_str::<serde_json::Value>(&s) {
                    if let Some(obj) = manifest.as_object_mut() {
                        obj.insert(
                            "dir".into(),
                            serde_json::Value::String(path.to_string_lossy().into_owned()),
                        );
                        let legacy = super::migration::is_legacy(&app, &dir_id);
                        obj.insert("legacy".into(), serde_json::Value::Bool(legacy));
                        if legacy {
                            obj.insert(
                                "permissions".into(),
                                serde_json::Value::Array(super::migration::legacy_permissions()),
                            );
                        }
                    }
                    out.push(manifest);
                }
            }
        }
    }
    out.sort_by_key(|m| m.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string());
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    /// Builds an in-memory zip: `manifest_filename` at the root (or pass
    /// `None` to omit a manifest entirely) plus each `(path, contents)` in
    /// `files`.
    fn build_zip(manifest_filename: Option<(&str, &str)>, files: &[(&str, &str)]) -> Vec<u8> {
        let mut buf = Vec::new();
        {
            let mut zip = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options = zip::write::SimpleFileOptions::default();
            if let Some((name, contents)) = manifest_filename {
                zip.start_file(name, options).unwrap();
                zip.write_all(contents.as_bytes()).unwrap();
            }
            for (path, contents) in files {
                zip.start_file(*path, options).unwrap();
                zip.write_all(contents.as_bytes()).unwrap();
            }
            zip.finish().unwrap();
        }
        buf
    }

    fn temp_root(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("pikapet-install-test-{name}-{:?}", std::thread::current().id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    const VALID_MANIFEST: &str = r#"{"id":"thing","name":"Thing","version":"1.0.0","entry":"index.html","permissions":[]}"#;

    #[test]
    fn rejects_zip_with_only_legacy_manifest() {
        let root = temp_root("legacy-only");
        let zip_bytes = build_zip(Some(("manifest.json", VALID_MANIFEST)), &[]);
        let err = install_archive(&root, zip_bytes, None).unwrap_err();
        assert!(err.contains("extension.json"), "error was: {err}");
        assert!(!root.join("thing").exists(), "nothing should be written on rejection");
    }

    #[test]
    fn rejects_unknown_permission_before_writing_anything() {
        let root = temp_root("bad-permission");
        let manifest = r#"{"id":"thing","name":"Thing","version":"1.0.0","entry":"index.html","permissions":["made:up"]}"#;
        let zip_bytes = build_zip(Some(("extension.json", manifest)), &[]);
        let err = install_archive(&root, zip_bytes, None).unwrap_err();
        assert!(err.contains("made:up"), "error was: {err}");
        assert!(!root.join("thing").exists(), "nothing should be written on rejection");
    }

    #[test]
    fn installs_valid_zip_and_extracts_files() {
        let root = temp_root("valid-install");
        let zip_bytes = build_zip(
            Some(("extension.json", VALID_MANIFEST)),
            &[("index.html", "<html></html>"), ("assets/icon.png", "not really a png")],
        );
        let manifest = install_archive(&root, zip_bytes, None).unwrap();
        assert_eq!(manifest["id"], "thing");
        assert!(root.join("thing/extension.json").is_file());
        assert!(root.join("thing/index.html").is_file());
        assert_eq!(
            std::fs::read_to_string(root.join("thing/assets/icon.png")).unwrap(),
            "not really a png"
        );
    }

    #[test]
    fn reinstall_overwrites_previous_version() {
        let root = temp_root("reinstall");
        let v1 = r#"{"id":"thing","name":"Thing","version":"1.0.0","entry":"index.html","permissions":[]}"#;
        let v2 = r#"{"id":"thing","name":"Thing","version":"2.0.0","entry":"index.html","permissions":[]}"#;
        install_archive(&root, build_zip(Some(("extension.json", v1)), &[("old.txt", "v1")]), None).unwrap();
        assert!(root.join("thing/old.txt").is_file());

        install_archive(&root, build_zip(Some(("extension.json", v2)), &[]), None).unwrap();
        assert!(!root.join("thing/old.txt").exists(), "reinstall should replace, not merge");
        let manifest: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(root.join("thing/extension.json")).unwrap()).unwrap();
        assert_eq!(manifest["version"], "2.0.0");
    }

    #[test]
    fn signature_check_runs_before_any_zip_parsing() {
        let root = temp_root("bad-signature");
        // A signature that can never match the app's embedded PUBLIC_KEY —
        // verification must fail (and nothing must be written) before the
        // zip is even opened, regardless of what's inside it.
        let zip_bytes = build_zip(Some(("extension.json", VALID_MANIFEST)), &[]);
        let bogus_sha256 = "0".repeat(64);
        let bogus_signature = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, [0u8; 64]);
        let err = install_archive(&root, zip_bytes, Some((&bogus_sha256, &bogus_signature))).unwrap_err();
        assert!(err.contains("mismatch"), "error was: {err}");
        assert!(!root.join("thing").exists());
    }
}
