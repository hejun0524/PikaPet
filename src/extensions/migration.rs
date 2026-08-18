// Legacy install detection. An extension installed before `extension.json`
// existed only has the old `manifest.json`, which never declared
// permissions at all — every installed extension got identical,
// unconditional bridge access under the old design (see
// `doc/extensions.md`'s bridge table). Rather than silently revoking
// capability a user has already been trusting for months on an
// unannounced update, a legacy install is granted the *full* permission
// catalog — matching its actual historical access exactly — and surfaced
// as "unverified" in the Manager tab, with a path to reinstall (and get
// properly verified) once a matching id shows up in the marketplace
// registry.
//
// The directory layout does not change for legacy installs: they're still
// `<extensions_dir>/<id>/`, just missing the new manifest file.

use super::manifest::PERMISSIONS;

/// True if this installed extension has no `extension.json` (only the old
/// `manifest.json`, or nothing readable at all — treated the same way,
/// since either case has no declared permissions to trust).
pub fn is_legacy(app: &tauri::AppHandle, id: &str) -> bool {
    !super::extensions_dir(app).join(id).join("extension.json").is_file()
}

/// The trust level assigned to legacy installs: every catalog permission.
pub fn legacy_permissions() -> Vec<serde_json::Value> {
    PERMISSIONS.iter().map(|s| serde_json::Value::String(s.to_string())).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legacy_permissions_covers_the_whole_catalog() {
        let granted = legacy_permissions();
        assert_eq!(granted.len(), PERMISSIONS.len());
        for p in PERMISSIONS {
            assert!(granted.contains(&serde_json::Value::String(p.to_string())), "missing {p}");
        }
    }
}
