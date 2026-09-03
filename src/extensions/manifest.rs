// The extension manifest schema (`extension.json`, ships inside every
// extension zip). This supersedes the old, unvalidated `manifest.json`
// (id/name/names/emoji/version/entry/widget/widgetHeight/widgetAuto only) by
// adding a required, enumerated `permissions` list plus `minAppVersion`,
// `author`, `description`, `icon` — every old field is kept unchanged so no
// existing display logic (tile emoji, widget rendering, locale names) breaks.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub names: HashMap<String, String>,
    #[serde(default = "default_emoji")]
    pub emoji: String,
    pub version: String,
    #[serde(rename = "minAppVersion", default, skip_serializing_if = "Option::is_none")]
    pub min_app_version: Option<String>,
    pub entry: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub widget: Option<String>,
    #[serde(rename = "widgetHeight", default, skip_serializing_if = "Option::is_none")]
    pub widget_height: Option<f64>,
    #[serde(rename = "widgetAuto", default)]
    pub widget_auto: bool,
    /// Required (may be an empty array) — every capability this extension
    /// asks for, checked against `PERMISSIONS` at install time.
    pub permissions: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

fn default_emoji() -> String {
    "🧩".to_string()
}

/// The fixed, enumerated permission catalog. A manifest declaring anything
/// outside this list fails validation entirely — no partial install with
/// warnings. `get-locale` and `say` need no permission at all (read-only /
/// non-sensitive, needed by nearly every extension just to render).
pub const PERMISSIONS: &[&str] = &[
    "dialog:pickFolder",
    "fs:read:workspace",
    "notifications:show",
    "windows:open",
    "widgets:show",
    "system:keepAwake",
    "network:fetch",
    "system:stats",
    "fs:scan",
    "fs:cleanup",
];

/// Parses and validates `extension.json` bytes: schema, id shape,
/// minAppVersion compatibility with the running app, and every declared
/// permission against `PERMISSIONS`. Returns the first error found — the
/// caller must not write anything to disk unless this returns `Ok`.
pub fn parse_and_validate(bytes: &[u8]) -> Result<ExtensionManifest, String> {
    let manifest: ExtensionManifest =
        serde_json::from_slice(bytes).map_err(|e| format!("bad extension.json: {e}"))?;

    if !super::valid_extension_id(&manifest.id) {
        return Err("invalid extension id (use letters, digits, - or _, \u{2264}40 chars)".into());
    }
    if manifest.name.trim().is_empty() {
        return Err("manifest is missing \"name\"".into());
    }
    if manifest.version.trim().is_empty() {
        return Err("manifest is missing \"version\"".into());
    }
    if manifest.entry.trim().is_empty() {
        return Err("manifest is missing \"entry\"".into());
    }
    if let Some(min) = &manifest.min_app_version {
        if parse_version(min).is_none() {
            return Err(format!(
                "invalid minAppVersion \"{min}\" (expected e.g. \"1.2.0\")"
            ));
        }
        if !version_satisfies(Some(min), env!("CARGO_PKG_VERSION")) {
            return Err(format!(
                "this extension requires app version {min} or newer (running {})",
                env!("CARGO_PKG_VERSION")
            ));
        }
    }
    for perm in &manifest.permissions {
        if !PERMISSIONS.contains(&perm.as_str()) {
            return Err(format!(
                "unknown permission \"{perm}\" \u{2014} supported: {}",
                PERMISSIONS.join(", ")
            ));
        }
    }
    Ok(manifest)
}

/// Hand-rolled MAJOR.MINOR.PATCH compare — every manifest seen in this app
/// uses plain numeric versions, so the `semver` crate's pre-release/build
/// metadata handling would be unused complexity.
fn parse_version(v: &str) -> Option<(u32, u32, u32)> {
    let mut parts = v.trim().split('.');
    let major = parts.next()?.trim().parse().ok()?;
    let minor = match parts.next() {
        Some(p) => p.trim().parse().ok()?,
        None => 0,
    };
    let patch = match parts.next() {
        Some(p) => p.trim().parse().ok()?,
        None => 0,
    };
    if parts.next().is_some() {
        return None; // more than 3 segments
    }
    Some((major, minor, patch))
}

/// `None` (no minAppVersion declared) always satisfies. An unparsable
/// `running` value (should never happen — it's our own `CARGO_PKG_VERSION`)
/// fails closed rather than silently passing.
pub fn version_satisfies(min_app_version: Option<&str>, running: &str) -> bool {
    let Some(min) = min_app_version else {
        return true;
    };
    match (parse_version(min), parse_version(running)) {
        (Some(min), Some(running)) => running >= min,
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn manifest_json(extra: &str) -> String {
        format!(
            r#"{{"id":"thing","name":"Thing","version":"1.0.0","entry":"index.html","permissions":[]{extra}}}"#
        )
    }

    #[test]
    fn accepts_minimal_valid_manifest() {
        let m = parse_and_validate(manifest_json("").as_bytes()).unwrap();
        assert_eq!(m.id, "thing");
        assert_eq!(m.emoji, "🧩"); // default fallback
    }

    #[test]
    fn rejects_unknown_permission() {
        let json = r#"{"id":"thing","name":"Thing","version":"1.0.0","entry":"index.html","permissions":["fs:read:workspace","made:up"]}"#;
        let err = parse_and_validate(json.as_bytes()).unwrap_err();
        assert!(err.contains("made:up"), "error was: {err}");
    }

    #[test]
    fn rejects_bad_id() {
        let json = r#"{"id":"has a space","name":"Thing","version":"1.0.0","entry":"index.html","permissions":[]}"#;
        assert!(parse_and_validate(json.as_bytes()).is_err());
    }

    #[test]
    fn rejects_unmet_min_app_version() {
        let json = r#"{"id":"thing","name":"Thing","version":"1.0.0","minAppVersion":"999.0.0","entry":"index.html","permissions":[]}"#;
        let err = parse_and_validate(json.as_bytes()).unwrap_err();
        assert!(err.contains("999.0.0"), "error was: {err}");
    }

    #[test]
    fn version_compare_pads_missing_segments() {
        assert!(version_satisfies(Some("1.2"), "1.2.5"));
        assert!(!version_satisfies(Some("1.3"), "1.2.5"));
        assert!(version_satisfies(None, "0.0.1"));
    }
}
