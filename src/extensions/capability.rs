// Generates and registers a Tauri capability from an extension's declared
// `permissions` (see `manifest::PERMISSIONS`), so its webview/window can
// call exactly the commands its manifest asked for — nothing more.
//
// This is only half the enforcement story: Tauri's command ACL gates which
// `#[tauri::command]`s a webview may invoke over IPC, but it does not
// restrict what that webview's own JS can do with native web platform APIs
// (fetch, XHR, WebSocket). `network:fetch` is deliberately absent from
// `commands_for_permission` below — it's enforced by per-webview CSP
// instead (see the plan's step 9), not by any Rust command.
//
// `fs:read:workspace`'s JS-only half (arbitrary `file-url` access via
// `convertFileSrc`) never leaves JS at all — see `doc/extensions.md`'s
// bridge table — so there's nothing at the Tauri-command layer to gate for
// that part; only `list-music` (a real command) is covered here.

use tauri::ipc::CapabilityBuilder;
use tauri::Manager;

/// Maps one catalog permission string to the Tauri permission identifiers
/// it should unlock. Returns an empty slice for permissions that aren't
/// gated at the Tauri-command layer (see module docs above).
pub fn commands_for_permission(permission: &str) -> &'static [&'static str] {
    match permission {
        "dialog:pickFolder" => &["dialog:allow-open"],
        "fs:read:workspace" => &["allow-list-music"],
        "notifications:show" => &["allow-notify"],
        "windows:open" => &["allow-open-extension-window"],
        "widgets:show" => &["allow-ext-widget-set", "allow-ext-widget-push"],
        "system:keepAwake" => &["allow-set-keep-awake", "allow-keep-awake-status"],
        // Burrow Cleaner (see cleaner.rs) — a normal, signed marketplace
        // extension like any other, just one that happens to ask for real
        // filesystem access. Split into three tiers so the install-time
        // permission prompt is honest about what it's granting: plain
        // numbers, read-only scanning, and the two calls that actually
        // touch disk.
        "system:stats" => &["allow-sys-status-snapshot"],
        "fs:scan" => &[
            "allow-sys-list-apps",
            "allow-sys-scan-leftovers",
            "allow-sys-scan-app-uninstall",
            "allow-sys-scan-purge-targets",
            "allow-sys-find-installers",
            "allow-sys-analyze-dir",
            "allow-sys-optimize-preview",
        ],
        "fs:cleanup" => &["allow-sys-delete-paths", "allow-sys-optimize-run"],
        _ => &[],
    }
}

/// Granted to every extension's child webview unconditionally, regardless
/// of declared permissions — `get-locale`/`say` are baseline/free (see
/// `manifest.rs`'s permission catalog table), so the commands backing them
/// need to always be allowed too.
const BASELINE_WEBVIEW: &[&str] = &["allow-ext-get-locale", "allow-ext-say"];

/// Granted to every extension's popup window unconditionally — not part of
/// the bridge at all, but needed by `extension-window.html`'s own shell
/// script (`boot.js`) to find the extension's page and pick up the saved
/// locale before it ever dispatches a single bridge request.
const BASELINE_WINDOW: &[&str] = &["allow-load-state", "allow-list-installed-extensions"];

fn resolved_permissions(declared: &[String], baseline: &[&'static str]) -> Vec<&'static str> {
    let mut out: Vec<&'static str> = baseline.to_vec();
    out.extend(declared.iter().flat_map(|p| commands_for_permission(p)));
    out.sort_unstable();
    out.dedup();
    out
}

/// Registers a capability scoped to one extension's child webview (labeled
/// `webview_label`), granting exactly the Tauri commands its declared
/// `permissions` unlock. Must be called *before* that webview is created —
/// the grant needs to already exist when the webview's first command call
/// arrives.
///
/// **Known limitation**: Tauri 2.11 has no API to remove a dynamically
/// registered capability within a running process — `add_capability`
/// merges into the existing resolved ACL rather than replacing it. If the
/// same `id` is reinstalled with a *smaller* permission set within the
/// same app session, its webview keeps the union of old + new permissions
/// until the app restarts. The boot-time loop in `main.rs`'s `setup` hook
/// (`register_all_at_boot`) is what makes each fresh launch authoritative
/// again — it's not optional cleanup, it's the only reset mechanism that
/// exists.
pub fn build_and_register<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    id: &str,
    webview_label: &str,
    permissions: &[String],
) -> Result<(), String> {
    // The extension's own entry page loads via `asset://localhost/…` (see
    // `hosting.rs::asset_url`) — confirmed live that Tauri's own
    // local-vs-remote URL classifier does *not* treat that as "local" for
    // a dynamically `add_child`'d webview. `.remote(...)` is the supported
    // mechanism for "this capability also applies to this URL" regardless
    // of that classification. The pattern is the bare origin
    // "asset://localhost" with **no** trailing `/*` — confirmed live (two
    // rounds of testing) that the ACL check's `request.url` is the
    // webview's *origin* (scheme+host only, standard same-origin-style
    // semantics), never the full path, so a pattern requiring a path
    // segment after `localhost` never matches anything real.
    let mut builder = CapabilityBuilder::new(format!("ext-{id}"))
        .webview(webview_label)
        .remote("asset://localhost".to_string());
    for perm in resolved_permissions(permissions, BASELINE_WEBVIEW) {
        builder = builder.permission(perm);
    }
    app.add_capability(builder).map_err(|e| e.to_string())
}

/// Same as `build_and_register`, but scoped to a real window rather than a
/// child webview — used for the popup-window path (`open_extension_window`),
/// which creates a genuine separate `WebviewWindow` today.
pub fn build_and_register_for_window<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    id: &str,
    window_label: &str,
    permissions: &[String],
) -> Result<(), String> {
    let mut builder = CapabilityBuilder::new(format!("ext-window-{id}")).window(window_label);
    for perm in resolved_permissions(permissions, BASELINE_WINDOW) {
        builder = builder.permission(perm);
    }
    app.add_capability(builder).map_err(|e| e.to_string())
}

/// Re-registers every installed extension's capability. Capabilities are
/// process-lifetime state, not persisted to disk, so this must run once at
/// every boot (see `main.rs`'s `setup` hook) — otherwise a fresh launch
/// would have no capabilities registered for extensions installed in a
/// previous run.
pub fn register_all_at_boot(app: &tauri::AppHandle) {
    for entry in super::install::list_installed_extensions(app.clone()) {
        let Some(id) = entry.get("id").and_then(|v| v.as_str()) else {
            continue;
        };
        let permissions: Vec<String> = entry
            .get("permissions")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
            .unwrap_or_default();
        if let Err(e) = build_and_register(app, id, &format!("ext-{id}"), &permissions) {
            eprintln!("[extensions] failed to register webview capability for {id}: {e}");
        }
        if let Err(e) = build_and_register_for_window(app, id, &format!("extension-{id}"), &permissions) {
            eprintln!("[extensions] failed to register window capability for {id}: {e}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_permissions_to_expected_commands() {
        assert_eq!(commands_for_permission("notifications:show"), &["allow-notify"]);
        assert_eq!(commands_for_permission("windows:open"), &["allow-open-extension-window"]);
        assert_eq!(commands_for_permission("widgets:show"), &["allow-ext-widget-set", "allow-ext-widget-push"]);
        assert_eq!(commands_for_permission("system:stats"), &["allow-sys-status-snapshot"]);
        assert_eq!(commands_for_permission("fs:cleanup"), &["allow-sys-delete-paths", "allow-sys-optimize-run"]);
        assert!(commands_for_permission("fs:scan").contains(&"allow-sys-scan-leftovers"));
        assert!(commands_for_permission("network:fetch").is_empty());
        assert!(commands_for_permission("made:up").is_empty());
    }

    #[test]
    fn resolved_permissions_dedupes_across_declared_list_and_includes_baseline() {
        let declared = vec!["system:keepAwake".to_string(), "system:keepAwake".to_string()];
        let resolved = resolved_permissions(&declared, BASELINE_WEBVIEW);
        assert_eq!(
            resolved,
            vec!["allow-ext-get-locale", "allow-ext-say", "allow-keep-awake-status", "allow-set-keep-awake"]
        );
    }

    #[test]
    fn resolved_permissions_with_no_declared_permissions_still_has_baseline() {
        // BASELINE_WEBVIEW ("allow-ext-get-locale", "allow-ext-say") is
        // already alphabetically sorted; BASELINE_WINDOW isn't, so compare
        // against a sorted copy rather than the declaration order.
        assert_eq!(resolved_permissions(&[], BASELINE_WEBVIEW), BASELINE_WEBVIEW.to_vec());
        assert_eq!(
            resolved_permissions(&[], BASELINE_WINDOW),
            vec!["allow-list-installed-extensions", "allow-load-state"]
        );
    }

    // No `build_and_register`/`build_and_register_for_window` unit test
    // against `tauri::test::mock_app()` exists here (there was one, for the
    // empty-permissions case, before baseline permissions were introduced
    // above): `mock_app()` has no knowledge of *our* app's build-time
    // ACL manifest, so resolving any app-command permission against it
    // fails with an "unknown manifest" error unrelated to this module's
    // logic — and now that baseline permissions (`allow-ext-get-locale`
    // etc.) are always included, that's true even for an empty declared
    // list, not just a populated one. Loading the real generated context
    // into the mock runtime instead would fix that
    // (`mock_builder().build(tauri::generate_context!())`), but
    // `generate_context!()` embeds a process-wide macOS Info.plist symbol
    // and `main.rs`'s own `fn main` already calls it once per test binary —
    // a second call anywhere in this crate collides on that symbol. So
    // "declared permissions actually resolve" is verified live instead,
    // the same way Step 2's ACL wiring was: by running the real app and
    // confirming no `[extensions] failed to register...` errors after
    // `register_all_at_boot` runs at boot against a real test extension.
}
