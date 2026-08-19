// Trust-transparency for installs that didn't go through marketplace
// signature verification. Two distinct things get checked, on purpose,
// since they don't imply each other:
//
// - `is_format_legacy`: this install has no `extension.json` at all (only
//   the old `manifest.json`, from before that schema existed) — meaning
//   it never declared permissions in the first place. Every installed
//   extension got identical, unconditional bridge access under the old
//   design (see `doc/extensions.md`'s bridge table), so rather than
//   silently revoking capability a user has already been trusting for
//   months on an unannounced update, a format-legacy install is granted
//   the *full* permission catalog (`legacy_permissions`) — matching its
//   actual historical access exactly.
//
// - `is_verified`: this specific on-disk install was checked against a
//   registry signature at install time (see `install.rs`'s `.verified`
//   marker). A *new-format* sideloaded zip (the Manager tab's "Install
//   from zip" button) has perfectly good, specific declared permissions —
//   those are trusted and used as-is, no override — but it still skipped
//   signature verification, so it's just as much "unverified" in the
//   Manager tab's badge as a format-legacy install is.
//
// The Manager tab's "⚠️ unverified" badge is `is_format_legacy || !is_verified`;
// the full-catalog permission override applies only to `is_format_legacy`.
//
// The directory layout does not change for either case: still
// `<extensions_dir>/<id>/`, just missing `extension.json` and/or the
// `.verified` marker.

use super::manifest::PERMISSIONS;

/// True if this installed extension has no `extension.json` (only the old
/// `manifest.json`, or nothing readable at all — treated the same way,
/// since either case has no declared permissions to trust).
pub fn is_format_legacy(app: &tauri::AppHandle, id: &str) -> bool {
    !super::extensions_dir(app).join(id).join("extension.json").is_file()
}

/// True if this specific on-disk install was checked against a registry
/// signature at install time (see `install.rs::install_archive`'s
/// `.verified` marker) — false for every local zip sideload, regardless
/// of manifest format.
pub fn is_verified(app: &tauri::AppHandle, id: &str) -> bool {
    super::extensions_dir(app).join(id).join(".verified").is_file()
}

/// The trust level assigned to format-legacy installs: every catalog
/// permission. Never applied just because `is_verified` is false — a
/// sideloaded new-format extension keeps its own specific declared
/// permissions untouched.
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
