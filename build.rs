// Registers every app-level `#[tauri::command]` with Tauri's ACL so
// `capabilities/*.json` actually gates them (autogenerates an
// `allow-$command`/`deny-$command` permission pair per name below, in the
// app's own unprefixed namespace). Without this, custom commands are
// callable from any local webview regardless of what capability files say.
fn main() {
    let attrs = tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
        "quit",
        "set_pet_hitbox",
        "show_window",
        "finish_setup",
        "reset_app",
        "load_state",
        "save_state",
        "get_data_paths",
        "open_data_folder",
        "change_data_dir",
        "import_custom_pet",
        "delete_custom_pet",
        "list_music",
        "install_extension",
        "install_extension_from_registry",
        "uninstall_extension",
        "list_installed_extensions",
        "notify",
        "open_extension_window",
        "set_keep_awake",
        "keep_awake_status",
        "log",
        "set_current_locale",
        "ext_get_locale",
        "ext_say",
        "ext_widget_set",
        "ext_widget_push",
        "ext_push",
        "open_extension_webview",
        "hide_extension_webview",
        "close_extension_webview",
        "fetch_registry",
        "update_status",
        "restart_to_update",
        "sys_status_snapshot",
        "sys_list_apps",
        "sys_scan_leftovers",
        "sys_scan_app_uninstall",
        "sys_scan_purge_targets",
        "sys_find_installers",
        "sys_optimize_preview",
        "sys_optimize_run",
        "sys_analyze_dir",
        "sys_delete_paths",
    ]));
    tauri_build::try_build(attrs).expect("failed to run build script");
}
