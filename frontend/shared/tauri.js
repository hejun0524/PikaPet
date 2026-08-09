// shared/tauri.js — single access point to the Tauri v2 global API bundle
// (`window.__TAURI__`, injected in every window because tauri.conf.json sets
// `withGlobalTauri: true`). Import Tauri primitives from here instead of
// destructuring the global in every file.

/**
 * Core IPC:
 * - `invoke(command, args)` calls a Rust `#[tauri::command]` and resolves with
 *   its return value.
 * - `convertFileSrc(path)` turns an absolute filesystem path into an asset URL
 *   the webview is allowed to load.
 */
export const { invoke, convertFileSrc } = window.__TAURI__.core;

/**
 * App-wide event bus shared by all windows:
 * - `emit(name, payload)` broadcasts an event.
 * - `listen(name, handler)` subscribes; the handler receives `{ payload }`.
 */
export const { emit, listen } = window.__TAURI__.event;

/** Webview window handles (e.g. `WebviewWindow.getByLabel("main")`). */
export const { WebviewWindow } = window.__TAURI__.webviewWindow;

/**
 * Window-management helpers for the current window and monitors:
 * `getCurrentWindow()`, `currentMonitor()`, plus the `PhysicalPosition` /
 * `LogicalSize` value types used by move/resize calls.
 */
export const { getCurrentWindow, currentMonitor, PhysicalPosition, LogicalSize } =
  window.__TAURI__.window;

/** Native menu builders (used by the pet window's right-click context menu). */
export const { Menu, PredefinedMenuItem } = window.__TAURI__.menu;
