// Extension bridge, redesigned for real child webviews. Extension pages
// used to run as `<iframe>`s inside the hub's own webview, so
// `parent.postMessage` worked (same-page DOM) and every privileged action
// (invoke/emit) ran in the hub's own trusted JS, unconditionally, for any
// installed extension — see `doc/extensions.md`'s bridge table for the old
// contract. A real child webview has no such DOM parent relationship, and
// `window.__TAURI__` is injected directly into it (since `withGlobalTauri`
// is on), so each extension now calls Rust *itself* — gated by its own
// per-extension capability (see `capability.rs`) rather than a shared,
// ungated hub-side dispatcher.
//
// `SHIM_JS` (injected via `WebviewBuilder::initialization_script`) keeps
// every already-written extension page working unmodified: it polyfills
// `window.parent.postMessage`/`window.addEventListener("message")` on top
// of `invoke()` and a `window.__pikapetPush` receiver for app→extension
// pushes (locale change, pause-on-navigate, widget-action) delivered via
// targeted `Webview::eval` from `ext_push` below — there is no Tauri
// event-bus access granted to extensions at all, intentionally: that bus
// carries full app state, and giving extensions `core:event:allow-listen`
// would be a far bigger leak than anything in the old bridge.

use tauri::{Emitter, Manager};

/// Identifies which extension is calling, from the caller's own
/// webview/window label — never from a client-supplied id, which would let
/// any extension impersonate another (the old design didn't have this
/// problem because the *hub*, not the extension, always made the call).
/// Covers both surfaces: a child webview (label `ext-<id>`) and a popup
/// window (label `extension-<id>` — popups are still same-window iframes,
/// so the calling webview's label equals the window's label there too).
pub fn calling_extension_id(webview: &tauri::Webview) -> Result<String, String> {
    if let Some(id) = webview.label().strip_prefix("ext-") {
        return Ok(id.to_string());
    }
    if let Some(id) = webview.window().label().strip_prefix("extension-") {
        return Ok(id.to_string());
    }
    Err("caller is not a recognized extension surface".into())
}

/// Mirrors the app's active locale, purely so `ext_get_locale` has
/// something to answer — Rust never tracked this before (locale was a
/// JS-only concept in the hub's state). Kept in sync by `set_current_locale`,
/// called from the hub at boot and on every language change.
#[derive(Default)]
pub struct AppLocale(pub std::sync::Mutex<String>);

#[tauri::command]
pub fn set_current_locale(state: tauri::State<AppLocale>, locale: String) {
    if let Ok(mut guard) = state.0.lock() {
        *guard = locale;
    }
}

/// `get-locale` — baseline, granted to every extension unconditionally
/// (matches its old free/unguarded status; read-only and non-sensitive).
#[tauri::command]
pub fn ext_get_locale(state: tauri::State<AppLocale>) -> String {
    state.0.lock().map(|g| g.clone()).unwrap_or_else(|_| "en".into())
}

/// `say` — baseline, granted unconditionally, same reasoning as get-locale
/// (the app already sanitizes what a speech bubble can show). The
/// `{callMe}`/`{petName}` template substitution the old JS dispatcher did
/// at *emission* time now happens at the *receiving* end instead (the pet
/// window's own `pet-say` listener) — Rust never needs to parse save.json
/// to answer this, and every other producer of `pet-say` already sends
/// pre-resolved text, so the receiver doing the substitution is harmless
/// for them (no `{callMe}`/`{petName}` substrings to replace).
#[tauri::command]
pub fn ext_say(app: tauri::AppHandle, text: String, ms: Option<f64>) -> Result<(), String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("say: empty text".into());
    }
    let clamped: String = trimmed.chars().take(200).collect();
    app.emit("pet-say", serde_json::json!({ "text": clamped, "ms": ms }))
        .map_err(|e| e.to_string())
}

/// `widget-set` — gated by `widgets:show`. Identity comes from the caller's
/// own label, never a client-supplied id.
#[tauri::command]
pub fn ext_widget_set(webview: tauri::Webview, app: tauri::AppHandle, on: bool) -> Result<(), String> {
    let id = calling_extension_id(&webview)?;
    app.emit("extension-widget-set", serde_json::json!({ "id": id, "on": on }))
        .map_err(|e| e.to_string())
}

/// `widget-push` — gated by `widgets:show`.
#[tauri::command]
pub fn ext_widget_push(
    webview: tauri::Webview,
    app: tauri::AppHandle,
    state: serde_json::Value,
) -> Result<(), String> {
    let id = calling_extension_id(&webview)?;
    app.emit("extension-widget-state", serde_json::json!({ "id": id, "state": state }))
        .map_err(|e| e.to_string())
}

/// App → extension push, delivered by evaluating a call to the shim's
/// `window.__pikapetPush(kind, data)` directly in that one extension's
/// child webview. Called only from trusted contexts (the hub, the stats
/// window) — extensions never call this themselves; it's how the hub
/// delivers `app-locale`/`extension-pause`/`widget-action`, none of which
/// can reach a separate child webview via `postMessage` anymore. A no-op
/// if that extension isn't currently open (nothing to push to).
#[tauri::command]
pub fn ext_push(app: tauri::AppHandle, id: String, kind: String, data: serde_json::Value) -> Result<(), String> {
    let Some(webview) = app.get_webview(&format!("ext-{id}")) else {
        return Ok(());
    };
    let js = format!(
        "window.__pikapetPush && window.__pikapetPush({}, {})",
        serde_json::to_string(&kind).map_err(|e| e.to_string())?,
        serde_json::to_string(&data).map_err(|e| e.to_string())?,
    );
    webview.eval(js).map_err(|e| e.to_string())
}

/// Builds the full script injected before an extension's own page scripts
/// run: an optional CSP restriction (see below) followed by the bridge
/// shim (`SHIM_JS`).
///
/// `network:fetch` enforcement note: Tauri's header-based CSP mechanism
/// (`WebviewBuilder::on_web_resource_request`) is wired only into the
/// `tauri://` protocol handler — confirmed by reading tauri-2.11.5's own
/// registration code (`src/manager/webview.rs`), it is never invoked for
/// the `asset://` scheme every extension webview's entry page is served
/// through (`hosting.rs::asset_url`). With no response-header hook
/// available, this instead inserts a
/// `<meta http-equiv="Content-Security-Policy">` element directly into
/// `<head>` as the first thing there, before any of the extension's own
/// inline `<script>`/`<style>` runs (`initialization_script` executes
/// ahead of page content). **`document.write` was tried first and
/// confirmed live to break the page outright**: called after parsing has
/// begun it wipes the existing document rather than inserting into it —
/// caught only by testing a real extension end-to-end (it never reported
/// anything at all, because its own script that would have reported never
/// ran). `document.head` insertion is non-destructive, but at
/// `WKUserScriptInjectionTimeAtDocumentStart` timing `document.head` may
/// not exist yet (the script runs right after the document object is
/// created, but "before any other content is loaded" per Apple's own
/// wording) — hence the retry loop rather than a single unguarded access.
/// Only `connect-src` is ever set this way; every other resource type
/// (script-src, style-src, img-src, …) is left unrestricted on purpose,
/// since extensions rely on inline scripts/styles per doc/extensions.md's
/// "self-contained single file" convention, and locking those down too
/// would be a separate, much larger change nobody asked for here.
pub fn init_script(network_fetch_granted: bool) -> String {
    if network_fetch_granted {
        return SHIM_JS.to_string();
    }
    format!(
        r#"(function insertCsp() {{
  if (document.head) {{
    var meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = "connect-src 'none'";
    document.head.insertBefore(meta, document.head.firstChild);
  }} else {{
    setTimeout(insertCsp, 0);
  }}
}})();
{SHIM_JS}"#
    )
}

/// Injected into every extension child webview before its own page scripts
/// run. See the module doc comment above for why this exists.
pub const SHIM_JS: &str = r#"
(function () {
  const core = window.__TAURI__ && window.__TAURI__.core;
  if (!core) return;

  async function dispatch(type, payload) {
    switch (type) {
      case "get-locale":
        return core.invoke("ext_get_locale");
      case "pick-folder":
        return core.invoke("plugin:dialog|open", { options: { directory: true, multiple: false } });
      case "list-music":
        return core.invoke("list_music", { dir: String((payload && payload.dir) || "~/Music") });
      case "file-url":
        return core.convertFileSrc(String((payload && payload.path) || ""));
      case "say":
        return core.invoke("ext_say", {
          text: String((payload && payload.text) || ""),
          ms: payload && payload.ms != null ? Number(payload.ms) : null,
        });
      case "notify":
        return core.invoke("notify", {
          title: String((payload && payload.title) || "MyPet"),
          body: String((payload && payload.body) || ""),
        });
      case "open-window":
        return core.invoke("open_extension_window", {
          page: String((payload && payload.page) || ""),
          width: Number(payload && payload.width) || 480,
          height: Number(payload && payload.height) || 360,
          title: String((payload && payload.title) || ""),
        });
      case "widget-set":
        return core.invoke("ext_widget_set", { on: !!(payload && payload.on) });
      case "widget-push":
        return core.invoke("ext_widget_push", { state: (payload && payload.state) ?? null });
      case "keep-awake":
        return core.invoke("set_keep_awake", { on: !!(payload && payload.on) });
      case "keep-awake-status":
        return core.invoke("keep_awake_status");
      default:
        throw new Error("unknown bridge request: " + type);
    }
  }

  // Polyfill the request half: parent.postMessage({reqId, type, payload})
  // -> a reply message {reqId, result, error} dispatched back on `window`,
  // exactly matching the `bridge()` helper every extension page already
  // has (see doc/extensions.md).
  const fakeParent = {
    postMessage(data) {
      const msg = data || {};
      const reqId = msg.reqId;
      if (typeof reqId === "undefined") return;
      dispatch(msg.type, msg.payload).then(
        (result) => window.dispatchEvent(new MessageEvent("message", { data: { reqId, result, error: null } })),
        (err) =>
          window.dispatchEvent(
            new MessageEvent("message", { data: { reqId, result: null, error: String((err && err.message) || err) } })
          )
      );
    },
  };
  try {
    Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });
  } catch (e) {
    console.error("pikapet bridge shim: could not override window.parent", e);
  }

  // Polyfill the push half: app-initiated messages (app-locale,
  // extension-pause, widget-action) arrive via `ext_push`'s
  // `webview.eval(...)` calling this function directly, and get
  // re-dispatched as the same synthetic `message` event shape extensions
  // already listen for.
  window.__pikapetPush = function (kind, data) {
    window.dispatchEvent(new MessageEvent("message", { data: Object.assign({ type: kind }, data) }));
  };
})();
"#;
