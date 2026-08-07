// Shell for add-on popup windows (opened via the "open-window" bridge
// request). Loads ?id=<addon>&page=<file> in a sandboxed iframe and serves
// the same postMessage bridge as the hub (see ADDONS.md). Note: widget-action
// messages are only delivered to the add-on's page in the hub, not here.
const { invoke, convertFileSrc } = window.__TAURI__.core;
const { emit } = window.__TAURI__.event;

const params = new URLSearchParams(location.search);
const addonId = params.get("id") ?? "";
const addonPage = params.get("page") ?? "";

async function handleRequest(type, payload) {
  if (type === "pick-folder") {
    return invoke("plugin:dialog|open", {
      options: { title: "Choose a folder", directory: true, multiple: false },
    });
  }
  if (type === "list-music") {
    return invoke("list_music", { dir: String(payload?.dir ?? "~/Music") });
  }
  if (type === "file-url") {
    return convertFileSrc(String(payload?.path ?? ""));
  }
  if (type === "notify") {
    return invoke("notify", {
      title: String(payload?.title ?? "MyPet"),
      body: String(payload?.body ?? ""),
    });
  }
  if (type === "open-window") {
    return invoke("open_addon_window", {
      id: addonId,
      page: String(payload?.page ?? ""),
      width: Number(payload?.width) || 480,
      height: Number(payload?.height) || 360,
      title: String(payload?.title ?? ""),
    });
  }
  if (type === "widget-set") {
    await emit("addon-widget-set", { id: addonId, on: !!payload?.on });
    return true;
  }
  if (type === "widget-push") {
    await emit("addon-widget-state", { id: addonId, state: payload?.state ?? null });
    return true;
  }
  throw new Error(`unknown bridge request: ${type}`);
}

window.addEventListener("message", async (e) => {
  const frame = document.querySelector("iframe");
  if (!frame || e.source !== frame.contentWindow) return;
  const { reqId, type, payload } = e.data ?? {};
  if (typeof reqId === "undefined") return;
  let result = null;
  let error = null;
  try {
    result = await handleRequest(type, payload);
  } catch (err) {
    error = String(err?.message ?? err);
  }
  frame.contentWindow.postMessage({ reqId, result, error }, "*");
});

(async () => {
  try {
    const installed = await invoke("list_installed_addons");
    const addon = installed.find((a) => a.id === addonId);
    if (!addon?.dir || !addonPage) throw new Error("add-on not installed");
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.src = convertFileSrc(`${addon.dir}/${addonPage}`);
    document.body.appendChild(frame);
  } catch (e) {
    document.body.innerHTML = `<div class="err">Could not load this add-on page 😿<br/>${String(e)}</div>`;
  }
})();
