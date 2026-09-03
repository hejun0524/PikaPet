// Backend for the "Burrow Cleaner" marketplace extension (id
// "pikapet-cleaner", source at extension-source/pikapet-cleaner/): live
// system stats plus Mole-inspired disk cleanup (mo clean/uninstall/
// optimize/analyze/status/purge/installer — commands here keep the sys_
// prefix regardless of that naming). macOS-only — every command below is a
// no-op error on other platforms, matching the existing pattern for
// set_keep_awake/notify.
//
// Every destructive flow is preview-then-confirm: a `sys_scan_*` command
// never touches disk, only returns {path, size} entries; the frontend
// collects the exact paths the user checked and passes that same list back
// to `sys_delete_paths`, which is the *only* command that deletes anything.
// There is no live re-scan on confirm (avoids TOCTOU surprises), and
// `sys_delete_paths` tolerates a path that vanished between scan and
// confirm (skips it, doesn't fail the whole batch) since a background
// process could plausibly touch the same caches/build dirs meanwhile.

use serde::Serialize;
use std::path::{Path, PathBuf};

/// Long-lived system-monitor handle (`.manage()`d once in main.rs): sysinfo
/// wants a persistent `Networks`/`Disks`/`System` to diff against, not a
/// fresh one per call — `NetworkData::received()`/`transmitted()` report
/// bytes *since the previous refresh*, so keeping one instance around and
/// refreshing it on each `sys_status_snapshot` call is what turns that into
/// a real bytes/sec rate (divided by the wall-clock gap since last poll)
/// instead of a meaningless one-shot number.
pub struct SysMonitor(pub std::sync::Mutex<SysMonitorState>);

pub struct SysMonitorState {
    sys: sysinfo::System,
    networks: sysinfo::Networks,
    disks: sysinfo::Disks,
    last_poll: std::time::Instant,
}

impl Default for SysMonitorState {
    fn default() -> Self {
        Self {
            sys: sysinfo::System::new_all(),
            networks: sysinfo::Networks::new_with_refreshed_list(),
            disks: sysinfo::Disks::new_with_refreshed_list(),
            last_poll: std::time::Instant::now(),
        }
    }
}

impl Default for SysMonitor {
    fn default() -> Self {
        Self(std::sync::Mutex::new(SysMonitorState::default()))
    }
}

/// `sys-status-snapshot` — read-only CPU/memory/disk/network snapshot.
/// Granted as part of the small fixed widget bridge subset (see
/// `stats/handleWidgetRequest.js`) as well as to the cleaner extension's own
/// page — plain utilization numbers carry no sensitive detail (no paths, no
/// filenames), unlike everything else in this module.
#[tauri::command]
pub fn sys_status_snapshot(state: tauri::State<SysMonitor>) -> Result<serde_json::Value, String> {
    let mut m = state.0.lock().map_err(|e| e.to_string())?;
    let now = std::time::Instant::now();
    let elapsed = now.duration_since(m.last_poll).as_secs_f64().max(0.001);
    m.last_poll = now;

    m.sys.refresh_cpu_usage();
    m.sys.refresh_memory();
    m.networks.refresh();
    m.disks.refresh();

    let (rx, tx) = m
        .networks
        .list()
        .values()
        .fold((0u64, 0u64), |(r, t), n| (r + n.received(), t + n.transmitted()));

    let disk = m
        .disks
        .list()
        .iter()
        .find(|d| d.mount_point() == Path::new("/"))
        .or_else(|| m.disks.list().first());
    let (disk_total, disk_available) = disk.map(|d| (d.total_space(), d.available_space())).unwrap_or((0, 0));

    Ok(serde_json::json!({
        "cpuPercent": m.sys.global_cpu_usage(),
        "memUsed": m.sys.used_memory(),
        "memTotal": m.sys.total_memory(),
        "netRxBytesPerSec": (rx as f64 / elapsed).round() as u64,
        "netTxBytesPerSec": (tx as f64 / elapsed).round() as u64,
        "diskTotal": disk_total,
        "diskAvailable": disk_available,
    }))
}

#[derive(Serialize)]
struct ScanEntry {
    path: String,
    size: u64,
}

#[derive(Serialize)]
struct ScanResult {
    entries: Vec<ScanEntry>,
    #[serde(rename = "totalBytes")]
    total_bytes: u64,
    approximate: bool,
}

fn to_result(entries: Vec<(PathBuf, u64, bool)>) -> ScanResult {
    let approximate = entries.iter().any(|(_, _, approx)| *approx);
    let total_bytes = entries.iter().map(|(_, size, _)| *size).sum();
    ScanResult {
        entries: entries
            .into_iter()
            .map(|(path, size, _)| ScanEntry { path: path.to_string_lossy().into_owned(), size })
            .collect(),
        total_bytes,
        approximate,
    }
}

#[cfg(target_os = "macos")]
fn home_dir() -> Result<PathBuf, String> {
    std::env::var("HOME").map(PathBuf::from).map_err(|_| "HOME is not set".to_string())
}

/// Recursively sums a path's size, following at most `budget` filesystem
/// entries (decremented as it goes) — bounds worst-case scan time against a
/// pathologically large directory. Never follows symlinks (avoids cycles
/// and double-counting). Returns `(bytes, hit_budget)`.
#[cfg(target_os = "macos")]
fn dir_size(path: &Path, budget: &mut u64) -> (u64, bool) {
    let Ok(meta) = std::fs::symlink_metadata(path) else {
        return (0, false);
    };
    if meta.file_type().is_symlink() {
        return (0, false);
    }
    if meta.is_file() {
        return (meta.len(), false);
    }
    let mut total = 0u64;
    let mut hit_budget = false;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if *budget == 0 {
                hit_budget = true;
                break;
            }
            *budget -= 1;
            let ft = match entry.file_type() {
                Ok(ft) => ft,
                Err(_) => continue,
            };
            if ft.is_symlink() {
                continue;
            } else if ft.is_dir() {
                let (size, sub_hit) = dir_size(&entry.path(), budget);
                total += size;
                hit_budget = hit_budget || sub_hit;
            } else if let Ok(m) = entry.metadata() {
                total += m.len();
            }
        }
    }
    (total, hit_budget)
}

/// One entry per Library dir this module treats as a per-app "home" —
/// caches, support files, logs, saved window state, preference plists.
/// Each entry's immediate children are candidate leftovers when their name
/// doesn't match any currently-installed app.
#[cfg(target_os = "macos")]
fn leftover_scan_roots(home: &Path) -> Vec<PathBuf> {
    vec![
        home.join("Library/Caches"),
        home.join("Library/Application Support"),
        home.join("Library/Logs"),
        home.join("Library/Saved Application State"),
        home.join("Library/Preferences"),
    ]
}

/// Strips the `.savedState`/`.plist` suffix macOS appends to some per-app
/// Library entries, leaving a bare bundle-id-shaped token to match against
/// installed apps.
fn strip_known_suffix(name: &str) -> &str {
    name.strip_suffix(".savedState").or_else(|| name.strip_suffix(".plist")).unwrap_or(name)
}

/// A token "looks like" a bundle id if it has at least one dot and every
/// segment is non-empty — filters out unrelated top-level entries (stray
/// user files, `Metadata`, etc.) that don't fit the `com.vendor.app` shape
/// every real bundle id has.
fn looks_like_bundle_id(token: &str) -> bool {
    token.contains('.') && token.split('.').all(|seg| !seg.is_empty())
}

#[derive(Debug, Clone, Serialize)]
pub struct InstalledApp {
    #[serde(rename = "bundleId")]
    bundle_id: String,
    name: String,
    path: String,
    size: u64,
}

/// Reads one `.app` bundle's `CFBundleIdentifier`/`CFBundleDisplayName` via
/// `plutil -convert json` (a macOS-builtin tool) rather than adding a plist-
/// parsing crate — the same "shell out to a system tool" pattern already
/// used for `notify` (osascript) and `set_keep_awake` (caffeinate).
#[cfg(target_os = "macos")]
fn read_app_info(app_path: &Path) -> Option<(String, String)> {
    let info_plist = app_path.join("Contents/Info.plist");
    let output = std::process::Command::new("plutil")
        .args(["-convert", "json", "-o", "-"])
        .arg(&info_plist)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let value: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
    let bundle_id = value.get("CFBundleIdentifier")?.as_str()?.to_string();
    let name = value
        .get("CFBundleDisplayName")
        .or_else(|| value.get("CFBundleName"))
        .and_then(|v| v.as_str())
        .map(str::to_string)
        .unwrap_or_else(|| app_path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default());
    Some((bundle_id, name))
}

#[cfg(target_os = "macos")]
fn list_apps_in(dir: &Path, out: &mut Vec<InstalledApp>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("app") {
            continue;
        }
        let Some((bundle_id, name)) = read_app_info(&path) else { continue };
        let mut budget = 40_000u64;
        let (size, _) = dir_size(&path, &mut budget);
        out.push(InstalledApp { bundle_id, name, path: path.to_string_lossy().into_owned(), size });
    }
}

/// `sys-list-apps` — enumerates installed `.app` bundles under `/Applications`
/// and `~/Applications`, for the Uninstall tab's app picker.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_list_apps() -> Result<Vec<InstalledApp>, String> {
    let mut out = Vec::new();
    list_apps_in(Path::new("/Applications"), &mut out);
    if let Ok(home) = home_dir() {
        list_apps_in(&home.join("Applications"), &mut out);
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(out)
}

/// `sys-scan-leftovers` — Library entries that look like a per-app folder
/// (bundle-id-shaped name) but don't match any currently-installed app:
/// the "already-uninstalled app leftovers" half of `mo clean`.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_scan_leftovers() -> Result<serde_json::Value, String> {
    let home = home_dir()?;
    let mut installed_ids = Vec::new();
    list_apps_in(Path::new("/Applications"), &mut installed_ids);
    list_apps_in(&home.join("Applications"), &mut installed_ids);
    let installed_ids: std::collections::HashSet<String> =
        installed_ids.into_iter().map(|a| a.bundle_id).collect();

    let mut found = Vec::new();
    for root in leftover_scan_roots(&home) {
        let Ok(entries) = std::fs::read_dir(&root) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            let Some(name) = path.file_name().and_then(|n| n.to_str()) else { continue };
            let token = strip_known_suffix(name);
            if !looks_like_bundle_id(token) || installed_ids.contains(token) {
                continue;
            }
            let mut budget = 20_000u64;
            let (size, approx) = dir_size(&path, &mut budget);
            if size > 0 {
                found.push((path, size, approx));
            }
        }
    }
    Ok(serde_json::to_value(to_result(found)).map_err(|e| e.to_string())?)
}

/// `sys-scan-app-uninstall` — the app bundle itself plus every Library entry
/// exactly matching its bundle id, ahead of a real uninstall.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_scan_app_uninstall(app_path: String, bundle_id: String) -> Result<serde_json::Value, String> {
    let app_path = PathBuf::from(app_path);
    if app_path.extension().and_then(|e| e.to_str()) != Some("app")
        || !app_path.starts_with("/Applications")
            && !home_dir().map(|h| app_path.starts_with(h.join("Applications"))).unwrap_or(false)
    {
        return Err("not an installed application".into());
    }
    if !looks_like_bundle_id(&bundle_id) {
        return Err("invalid bundle id".into());
    }
    let home = home_dir()?;
    let mut found = Vec::new();
    if app_path.exists() {
        let mut budget = 200_000u64;
        let (size, approx) = dir_size(&app_path, &mut budget);
        found.push((app_path, size, approx));
    }
    for root in leftover_scan_roots(&home) {
        let Ok(entries) = std::fs::read_dir(&root) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            let Some(name) = path.file_name().and_then(|n| n.to_str()) else { continue };
            if strip_known_suffix(name) != bundle_id {
                continue;
            }
            let mut budget = 20_000u64;
            let (size, approx) = dir_size(&path, &mut budget);
            found.push((path, size, approx));
        }
    }
    Ok(serde_json::to_value(to_result(found)).map_err(|e| e.to_string())?)
}

/// Directory names `mo purge` treats as disposable build artifacts. Matched
/// dirs are never descended into further — the whole thing is one leaf.
const PURGE_TARGET_NAMES: &[&str] =
    &["node_modules", "target", "dist", "build", ".next", ".nuxt", "__pycache__", ".venv", "venv"];

/// `sys-scan-purge-targets` — walks `root` (must resolve under the user's
/// home directory — a performance/safety bound, not a delete-time guard;
/// `sys_delete_paths` re-checks every path on its own terms) for known
/// build-artifact directory names, depth- and entry-capped so a huge or
/// deeply nested project tree can't make one scan run unbounded.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_scan_purge_targets(root: String) -> Result<serde_json::Value, String> {
    let home = home_dir()?;
    let root = PathBuf::from(root).canonicalize().map_err(|e| e.to_string())?;
    if !root.starts_with(&home) || !root.is_dir() {
        return Err("root must be an existing directory under your home folder".into());
    }
    let mut found = Vec::new();
    let mut entry_budget = 200_000u64;
    walk_for_purge_targets(&root, 0, &mut entry_budget, &mut found);
    Ok(serde_json::to_value(to_result(found)).map_err(|e| e.to_string())?)
}

#[cfg(target_os = "macos")]
fn walk_for_purge_targets(dir: &Path, depth: u32, entry_budget: &mut u64, found: &mut Vec<(PathBuf, u64, bool)>) {
    if depth > 10 || *entry_budget == 0 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        if *entry_budget == 0 {
            return;
        }
        *entry_budget -= 1;
        let Ok(ft) = entry.file_type() else { continue };
        if ft.is_symlink() || !ft.is_dir() {
            continue;
        }
        let path = entry.path();
        let is_target = path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|n| PURGE_TARGET_NAMES.contains(&n))
            .unwrap_or(false);
        if is_target {
            let mut size_budget = 200_000u64;
            let (size, approx) = dir_size(&path, &mut size_budget);
            if size > 0 {
                found.push((path, size, approx));
            }
            continue; // never descend into a matched target
        }
        // Hidden dirs (other than the ones above) are usually VCS/tooling
        // metadata, not project trees worth descending into.
        if path.file_name().and_then(|n| n.to_str()).map(|n| n.starts_with('.')).unwrap_or(false) {
            continue;
        }
        walk_for_purge_targets(&path, depth + 1, entry_budget, found);
    }
}

/// `sys-find-installers` — leftover `.dmg`/`.pkg` files in Downloads/Desktop
/// (top level plus one level into subfolders).
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_find_installers() -> Result<serde_json::Value, String> {
    let home = home_dir()?;
    let mut found = Vec::new();
    for root in [home.join("Downloads"), home.join("Desktop")] {
        collect_installers(&root, 0, &mut found);
    }
    Ok(serde_json::to_value(to_result(found)).map_err(|e| e.to_string())?)
}

#[cfg(target_os = "macos")]
fn collect_installers(dir: &Path, depth: u32, found: &mut Vec<(PathBuf, u64, bool)>) {
    if depth > 1 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(ft) = entry.file_type() else { continue };
        if ft.is_dir() {
            collect_installers(&path, depth + 1, found);
            continue;
        }
        let is_installer = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("dmg") || e.eq_ignore_ascii_case("pkg"))
            .unwrap_or(false);
        if is_installer {
            if let Ok(meta) = entry.metadata() {
                found.push((path, meta.len(), false));
            }
        }
    }
}

#[derive(Serialize)]
struct OptimizeAction {
    id: &'static str,
    label: &'static str,
    description: &'static str,
}

const OPTIMIZE_ACTIONS: &[OptimizeAction] = &[
    OptimizeAction {
        id: "flush_dns",
        label: "Flush DNS cache",
        description: "Clears cached DNS lookups (dscacheutil + mDNSResponder). Safe; sites just re-resolve.",
    },
    OptimizeAction {
        id: "purge_font_cache",
        label: "Rebuild font cache",
        description: "Removes the system's cached font database (atsutil). Safe; macOS rebuilds it automatically.",
    },
    OptimizeAction {
        id: "restart_finder",
        label: "Restart Finder",
        description: "Quits and relaunches Finder. Any open Finder windows close.",
    },
    OptimizeAction {
        id: "restart_dock",
        label: "Restart Dock",
        description: "Quits and relaunches the Dock. It briefly disappears and reappears.",
    },
];

/// `sys-optimize-preview` — the fixed, individually-disclosed action catalog;
/// never runs anything itself.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_optimize_preview() -> Vec<serde_json::Value> {
    OPTIMIZE_ACTIONS.iter().map(|a| serde_json::json!({"id": a.id, "label": a.label, "description": a.description})).collect()
}

/// `sys-optimize-run` — runs only the requested ids, each individually
/// validated against the fixed catalog above (never arbitrary shell input).
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_optimize_run(actions: Vec<String>) -> Result<Vec<serde_json::Value>, String> {
    let mut results = Vec::new();
    for id in actions {
        if !OPTIMIZE_ACTIONS.iter().any(|a| a.id == id) {
            results.push(serde_json::json!({"id": id, "ok": false, "error": "unknown action"}));
            continue;
        }
        let outcome = run_optimize_action(&id);
        results.push(serde_json::json!({"id": id, "ok": outcome.is_ok(), "error": outcome.err()}));
    }
    Ok(results)
}

#[cfg(target_os = "macos")]
fn run_optimize_action(id: &str) -> Result<(), String> {
    let run = |cmd: &str, args: &[&str]| -> Result<(), String> {
        std::process::Command::new(cmd).args(args).status().map_err(|e| e.to_string()).and_then(|s| {
            if s.success() {
                Ok(())
            } else {
                Err(format!("{cmd} exited with {s}"))
            }
        })
    };
    match id {
        "flush_dns" => {
            run("dscacheutil", &["-flushcache"])?;
            run("killall", &["-HUP", "mDNSResponder"])
        }
        "purge_font_cache" => run("atsutil", &["databases", "-remove"]),
        "restart_finder" => run("killall", &["Finder"]),
        "restart_dock" => run("killall", &["Dock"]),
        _ => Err("unknown action".into()),
    }
}

/// `sys-analyze-dir` — one level of child-size breakdown (a drill-down list,
/// not a full treemap) for the disk explorer. `path` defaults to home.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_analyze_dir(path: Option<String>) -> Result<serde_json::Value, String> {
    let dir = match path {
        Some(p) => PathBuf::from(p),
        None => home_dir()?,
    };
    if !dir.is_dir() {
        return Err("not a directory".into());
    }
    let mut found = Vec::new();
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Err("could not read directory (check Full Disk Access in System Settings)".into());
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let mut budget = 60_000u64;
        let (size, approx) = dir_size(&path, &mut budget);
        found.push((path, size, approx));
    }
    found.sort_by(|a, b| b.1.cmp(&a.1));
    Ok(serde_json::to_value(to_result(found)).map_err(|e| e.to_string())?)
}

#[derive(Serialize)]
struct DeleteOutcome {
    path: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    skipped: bool,
}

/// Every deletion this module ever performs must pass this check — see the
/// module doc comment. Rather than trusting a single "under this one root"
/// prefix (which can't cover both `/Applications/Foo.app` and
/// `~/Library/Caches/...` at once), a path is allowed if it matches *any*
/// of the four shapes each destructive scan above actually produces. This
/// is deliberately independent of what `sys_delete_paths`'s caller claims —
/// it re-derives the same shape checks the scans used, so a compromised or
/// buggy frontend can't smuggle in an arbitrary path just by asking nicely.
#[cfg(target_os = "macos")]
fn is_deletable(path: &Path) -> bool {
    let Ok(home) = home_dir() else { return false };
    let is_app_bundle = path.extension().and_then(|e| e.to_str()) == Some("app")
        && (path.starts_with("/Applications") || path.starts_with(home.join("Applications")));
    let is_library_leftover = leftover_scan_roots(&home).iter().any(|root| path.parent() == Some(root.as_path()));
    let is_purge_target = path
        .file_name()
        .and_then(|n| n.to_str())
        .map(|n| PURGE_TARGET_NAMES.contains(&n))
        .unwrap_or(false)
        && path.starts_with(&home);
    let is_installer = (path.starts_with(home.join("Downloads")) || path.starts_with(home.join("Desktop")))
        && path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("dmg") || e.eq_ignore_ascii_case("pkg"))
            .unwrap_or(false);
    is_app_bundle || is_library_leftover || is_purge_target || is_installer
}

/// `sys-delete-paths` — the single shared delete primitive for clean /
/// uninstall / purge / installer-removal. Takes only the exact paths a
/// prior `sys_scan_*` call returned (no live re-scan). Moves to the Trash
/// rather than permanently deleting, so a scan/matching bug is recoverable
/// by the user rather than silently destructive. A path that no longer
/// exists, or fails the shape check above, is reported per-item rather than
/// failing the whole batch.
#[tauri::command]
#[cfg(target_os = "macos")]
pub fn sys_delete_paths(paths: Vec<String>) -> Result<Vec<serde_json::Value>, String> {
    let mut out: Vec<DeleteOutcome> = Vec::new();
    for raw in paths {
        let path = PathBuf::from(&raw);
        let canonical = match path.canonicalize() {
            Ok(p) => p,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                out.push(DeleteOutcome { path: raw, ok: true, error: None, skipped: true });
                continue;
            }
            Err(e) => {
                out.push(DeleteOutcome { path: raw, ok: false, error: Some(e.to_string()), skipped: false });
                continue;
            }
        };
        if !is_deletable(&canonical) {
            out.push(DeleteOutcome {
                path: canonical.to_string_lossy().into_owned(),
                ok: false,
                error: Some("rejected: not a recognized cleanup target".into()),
                skipped: false,
            });
            continue;
        }
        let outcome = trash::delete(&canonical);
        out.push(DeleteOutcome {
            path: canonical.to_string_lossy().into_owned(),
            ok: outcome.is_ok(),
            error: outcome.err().map(|e| e.to_string()),
            skipped: false,
        });
    }
    Ok(out.into_iter().map(|o| serde_json::to_value(o).unwrap()).collect())
}

// ── Non-macOS fallbacks ─────────────────────────────────────────────────
// Every command above is macOS-only (bundle scanning, plutil, launchd-style
// system tools); every command below just returns the same "not supported"
// error `set_keep_awake`/`notify` already use for the same reason, so the
// frontend has one consistent error path rather than a command that's
// missing entirely on other platforms.
#[cfg(not(target_os = "macos"))]
mod unsupported {
    const MSG: &str = "Burrow Cleaner is only supported on macOS";

    #[tauri::command]
    pub fn sys_list_apps() -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_scan_leftovers() -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_scan_app_uninstall(_app_path: String, _bundle_id: String) -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_scan_purge_targets(_root: String) -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_find_installers() -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_optimize_preview() -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_optimize_run(_actions: Vec<String>) -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_analyze_dir(_path: Option<String>) -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
    #[tauri::command]
    pub fn sys_delete_paths(_paths: Vec<String>) -> Result<serde_json::Value, String> {
        Err(MSG.into())
    }
}
#[cfg(not(target_os = "macos"))]
pub use unsupported::*;

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;

    #[test]
    fn bundle_id_shape_check() {
        assert!(looks_like_bundle_id("com.apple.Safari"));
        assert!(looks_like_bundle_id("com.foo.bar.baz"));
        assert!(!looks_like_bundle_id("NoDotsHere"));
        assert!(!looks_like_bundle_id("")); // no dot at all
        assert!(!looks_like_bundle_id("trailing.")); // empty final segment
        assert!(!looks_like_bundle_id(".leading"));
    }

    #[test]
    fn strips_known_library_suffixes_only() {
        assert_eq!(strip_known_suffix("com.foo.bar.savedState"), "com.foo.bar");
        assert_eq!(strip_known_suffix("com.foo.bar.plist"), "com.foo.bar");
        assert_eq!(strip_known_suffix("com.foo.bar"), "com.foo.bar");
    }

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("pikapet-cleaner-test-{name}-{:?}", std::thread::current().id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn dir_size_sums_nested_files_and_ignores_symlink_targets() {
        let root = temp_dir("dir-size");
        std::fs::write(root.join("a.txt"), b"12345").unwrap();
        std::fs::create_dir_all(root.join("sub")).unwrap();
        std::fs::write(root.join("sub/b.txt"), b"1234567890").unwrap();
        #[cfg(unix)]
        {
            let _ = std::os::unix::fs::symlink(root.join("a.txt"), root.join("link.txt"));
        }
        let mut budget = 1000u64;
        let (size, hit_budget) = dir_size(&root, &mut budget);
        assert_eq!(size, 15); // 5 + 10, the symlink itself contributes nothing
        assert!(!hit_budget);
    }

    #[test]
    fn dir_size_respects_entry_budget() {
        let root = temp_dir("dir-size-budget");
        for i in 0..5 {
            std::fs::write(root.join(format!("f{i}.txt")), b"x").unwrap();
        }
        let mut budget = 2u64;
        let (_, hit_budget) = dir_size(&root, &mut budget);
        assert!(hit_budget, "a 2-entry budget over 5 files should report it ran out");
    }

    #[test]
    fn purge_target_names_matches_common_build_dirs() {
        for name in ["node_modules", "target", "dist", "build", ".venv"] {
            assert!(PURGE_TARGET_NAMES.contains(&name));
        }
        assert!(!PURGE_TARGET_NAMES.contains(&"src"));
    }
}
