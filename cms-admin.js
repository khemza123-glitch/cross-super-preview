(() => {
  // cms/editor-link.js
  function editorAccess(href, storedKey) {
    const url = new URL(href), provided = new URLSearchParams(url.hash.slice(1)).get("key");
    const key2 = provided || storedKey || null;
    if (key2) url.hash = new URLSearchParams({ key: key2 }).toString();
    return { key: key2, provided, url: key2 ? url.href : null };
  }

  // cms/gateway.js
  var config = window.CSCMS_CONFIG;
  var access = editorAccess(location.href, sessionStorage.getItem("cross-super-editor-key"));
  var key = access.key;
  if (access.provided) sessionStorage.setItem("cross-super-editor-key", key);
  if (access.url && access.url !== location.href) history.replaceState(null, "", access.url);
  function hasEditorLink() {
    return !!key;
  }
  function editorShareLink() {
    return editorAccess(location.href, key).url;
  }
  function forgetEditorLink() {
    key = null;
    sessionStorage.removeItem("cross-super-editor-key");
    history.replaceState(null, "", location.pathname + location.search);
  }
  async function api(action, payload = {}, file = null) {
    if (!key) throw Error("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E08\u0E32\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A");
    const headers = { Authorization: "Bearer " + key };
    let body;
    if (file) {
      body = new FormData();
      body.set("file", file);
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ action, ...payload });
    }
    const r = await fetch(config.url + "/functions/v1/cross-super-editor", { method: "POST", headers, body, cache: "no-store", signal: AbortSignal.timeout(file ? 9e4 : 45e3) });
    const result = await r.json().catch(() => ({ message: "\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" }));
    if (!r.ok) {
      const e = new Error(result.message || "\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      e.code = result.code;
      throw e;
    }
    return result;
  }

  // cms/validation.js
  function safeURL(value2, kind = "image") {
    if (typeof value2 !== "string" || value2.length > 2e4 || /[\u0000-\u001f]/.test(value2)) return false;
    if (kind === "link" && /^(?:#[\w-]+|mailto:[^\s<>]+|tel:[+\d ()-]+)$/.test(value2)) return true;
    if (!value2) return kind === "link";
    if (/^(?!\/\/)(?:\.?\.?\/)?[a-zA-Z0-9_\-/]+(?:\.[a-zA-Z0-9]+)?(?:[?#][^\s<>]*)?$/.test(value2)) return true;
    try {
      const u = new URL(value2);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }
  function effectiveStore(base, patch) {
    return { ...base, ...Object.fromEntries(Object.entries(patch || {}).filter(([k, v]) => ["name", "address", "phone"].includes(k) && typeof v === "string")) };
  }
  function validateDocument(doc, catalog2) {
    if (!doc || typeof doc !== "object" || !doc.fields || Array.isArray(doc.fields) || typeof doc.fields !== "object") throw Error("\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
    const fields = new Map(catalog2.fields.map((f) => [f.id, f]));
    for (const [k, v] of Object.entries(doc.fields)) {
      const f = fields.get(k);
      if (!f || typeof v !== "string" || v.length > 2e4) throw Error("\u0E0A\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: " + k);
      if (["media", "background", "dynamic-media", "vector"].includes(f.kind) && !safeURL(v)) throw Error("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49\u0E25\u0E34\u0E07\u0E01\u0E4C HTTPS");
      if (f.kind === "link" && !safeURL(v, "link")) throw Error("\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
    }
    for (const [id, patch] of Object.entries(doc.stores || {})) {
      if (!catalog2.stores.some((s) => String(s.id) === id) || !patch || typeof patch !== "object" || Array.isArray(patch)) throw Error("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
      for (const [k, v] of Object.entries(patch)) if (!["name", "address", "phone"].includes(k) || typeof v !== "string" || v.length > 2e3) throw Error("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
    }
    return true;
  }

  // cms/admin.js
  var config2 = window.CSCMS_CONFIG;
  var $ = (id) => document.getElementById(id);
  var copy = (o) => structuredClone(o);
  var mediaKinds = ["media", "background", "dynamic-media", "vector"];
  var catalog;
  var states;
  var working = { fields: {} };
  var saved = "{}";
  var page = "home";
  var view = "content";
  var selection = null;
  var frameReady = false;
  var inspect = true;
  var busy = false;
  var timer;
  var fieldsById = /* @__PURE__ */ new Map();
  function node(tag, text, cls) {
    const el = document.createElement(tag);
    if (text !== void 0) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function toast(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $("toast").hidden = true, 7e3);
  }
  $("copy-editor-link").onclick = async () => {
    const link = editorShareLink();
    if (!link) {
      toast("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E08\u0E32\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E09\u0E1A\u0E31\u0E1A\u0E40\u0E15\u0E47\u0E21");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast("\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E09\u0E1A\u0E31\u0E1A\u0E40\u0E15\u0E47\u0E21\u0E41\u0E25\u0E49\u0E27 \u0E2A\u0E48\u0E07\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22");
    } catch {
      $("share-link-value").value = link;
      $("share-dialog").showModal();
      $("share-link-value").focus();
      $("share-link-value").select();
    }
  };
  function message(e) {
    if (e?.code === "40001") return "\u0E21\u0E35\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07";
    if (/invalid login/i.test(e?.message)) return "\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07";
    if (/email not confirmed/i.test(e?.message)) return "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A";
    if (/rate limit/i.test(e?.message)) return "\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E16\u0E35\u0E48\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E2A\u0E31\u0E01\u0E04\u0E23\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07";
    return e?.message || "\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48";
  }
  async function enter() {
    if (!hasEditorLink()) throw Error("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E49\u0E32\u0E19\u0E08\u0E32\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A");
    const result = await api("load");
    catalog = await fetch("./cms-catalog.json").then((r) => {
      if (!r.ok) throw Error("\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      return r.json();
    });
    for (const f of catalog.fields) fieldsById.set(f.id, f);
    if (result.states.length !== 2) throw Error("\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E23\u0E49\u0E2D\u0E21");
    states = Object.fromEntries(result.states.map((s) => [s.id, s]));
    working = copy(states.draft.document);
    saved = JSON.stringify(working);
    $("account-email").textContent = "\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27";
    $("field-total").textContent = catalog.fields.length.toLocaleString();
    renderPages();
    $("auth").hidden = true;
    $("app").hidden = false;
    setPage(page);
    status();
  }
  function status() {
    const dirty = JSON.stringify(working) !== saved;
    $("save-status").textContent = dirty ? "\u0E21\u0E35\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" : `\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07 ${states?.draft.revision || 0} \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27`;
    $("save-draft").disabled = busy || !dirty;
    $("publish").disabled = busy;
  }
  function renderPages() {
    const nav2 = $("pages");
    nav2.replaceChildren();
    for (const [id, label] of Object.entries(catalog.pages)) {
      const b = node("button", label);
      b.dataset.page = id;
      b.onclick = () => setPage(id);
      nav2.append(b);
    }
    if (!$("page-select")) {
      const select = node("select");
      select.id = "page-select";
      select.setAttribute("aria-label", "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C");
      select.style.cssText = "font-size:12px;margin-top:7px";
      for (const [id, label] of Object.entries(catalog.pages)) {
        const option = node("option", label);
        option.value = id;
        select.append(option);
      }
      select.onchange = () => setPage(select.value);
      $("content-nav").after(select);
    }
  }
  function nav(id) {
    for (const b of document.querySelectorAll(".nav-action")) b.classList.toggle("current", b.id === id);
  }
  function setPage(id) {
    page = id;
    view = "content";
    selection = null;
    $("search").value = "";
    $("kind").value = "all";
    $("page-title").textContent = catalog.pages[id];
    $("editor-title").textContent = "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49";
    $("editor-layout").hidden = false;
    $("history-panel").hidden = true;
    for (const b of $("pages").children) b.classList.toggle("current", b.dataset.page === id);
    $("page-select").value = id;
    nav("content-nav");
    render();
    reload();
  }
  function send(type, extra = {}) {
    $("preview").contentWindow?.postMessage({ type, ...extra }, location.origin);
  }
  function reload() {
    frameReady = false;
    clearTimeout(timer);
    const route = ["shared", "system"].includes(page) ? "home" : page;
    $("preview").src = new URL("./?cms-preview=1&v=" + Date.now() + "#" + route, location.href).href;
  }
  function sync(reloadNeeded = false) {
    if (reloadNeeded) {
      clearTimeout(timer);
      timer = setTimeout(reload, 700);
    } else if (frameReady) send("cs-cms-content", { document: working });
  }
  window.addEventListener("message", (e) => {
    if (e.source !== $("preview").contentWindow || e.origin !== location.origin) return;
    const m = e.data;
    if (m?.type === "cs-cms-bootstrap") send("cs-cms-content", { document: working });
    if (m?.type === "cs-cms-ready") {
      frameReady = true;
      send("cs-cms-inspect", { enabled: inspect });
    }
    if (m?.type === "cs-cms-select") {
      selection = m.ids.filter((id) => fieldsById.has(id));
      view = "content";
      $("search").value = "";
      $("kind").value = "all";
      render();
    }
  });
  function value(f) {
    return Object.hasOwn(working.fields, f.id) ? working.fields[f.id] : f.default;
  }
  function change(f, v) {
    if (v === f.default) delete working.fields[f.id];
    else working.fields[f.id] = v;
    status();
    sync(["dynamic", "dynamic-media", "media"].includes(f.kind));
  }
  function render() {
    if (view === "stores") {
      renderStores();
      return;
    }
    $("editor-layout").hidden = false;
    $("history-panel").hidden = true;
    $("clear-selection").hidden = !selection;
    const q = $("search").value.trim().toLocaleLowerCase(), kind = $("kind").value;
    const list = catalog.fields.filter((f) => selection ? selection.includes(f.id) : view === "media" ? mediaKinds.includes(f.kind) : f.page === page).filter((f) => (kind === "all" || kind === "media" && mediaKinds.includes(f.kind) || kind === "text" && ["text", "dynamic", "attribute", "pseudo"].includes(f.kind) || kind === "link" && f.kind === "link") && (!q || [f.label, f.default, value(f), f.id].some((v) => String(v).toLocaleLowerCase().includes(q))));
    $("field-count").textContent = `${list.length.toLocaleString()} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23${selection ? " \xB7 \u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01" : ""}`;
    $("field-list").replaceChildren();
    if (!list.length) {
      $("field-list").append(node("p", "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19", "empty"));
      return;
    }
    let offset = 0;
    const batch = () => {
      for (const f of list.slice(offset, offset + 35)) $("field-list").append(card(f));
      offset += 35;
      if (offset < list.length) {
        const b = node("button", `\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E40\u0E2B\u0E25\u0E37\u0E2D ${list.length - offset} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`, "wide");
        b.onclick = () => {
          b.remove();
          batch();
        };
        $("field-list").append(b);
      }
    };
    batch();
  }
  function card(f) {
    const el = node("article", void 0, "field");
    el.classList.toggle("changed", Object.hasOwn(working.fields, f.id));
    const label = node("div", void 0, "field-label"), focus = node("button", "\u25CE");
    focus.title = "\u0E14\u0E39\u0E08\u0E38\u0E14\u0E19\u0E35\u0E49\u0E43\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07";
    focus.onclick = () => send("cs-cms-focus", { id: f.id });
    label.append(node("strong", f.label), focus);
    el.append(label);
    const current = value(f);
    if (mediaKinds.includes(f.kind)) {
      const video = /\.(mp4|webm)(?:[?#]|$)/i.test(current), img = node(video ? "video" : "img");
      if (video) img.controls = true;
      else img.alt = f.label;
      img.src = new URL(current, new URL("./", location.href)).href;
      el.append(img);
      const label2 = node("label", "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E43\u0E2B\u0E21\u0E48 / \u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D", "upload-label"), upload = node("input");
      upload.type = "file";
      upload.accept = "image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm";
      upload.onchange = async () => {
        if (!upload.files?.[0]) return;
        upload.disabled = true;
        try {
          const url = await uploadFile(upload.files[0]);
          change(f, url);
          render();
          toast("\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48");
        } catch (e) {
          toast(message(e));
        } finally {
          upload.disabled = false;
        }
      };
      label2.append(upload);
      el.append(label2);
    }
    const input = node(mediaKinds.includes(f.kind) || f.kind === "link" ? "input" : "textarea");
    input.value = current;
    input.setAttribute("aria-label", f.label);
    if (input.tagName === "TEXTAREA") input.rows = Math.min(7, Math.max(2, Math.ceil(current.length / 38)));
    input.oninput = () => {
      change(f, input.value);
      el.classList.toggle("changed", Object.hasOwn(working.fields, f.id));
    };
    el.append(input);
    const actions = node("div", void 0, "field-actions"), restore = node("button", "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A");
    restore.onclick = () => {
      delete working.fields[f.id];
      status();
      render();
      sync(true);
    };
    actions.append(restore);
    el.append(actions, node("div", f.id, "field-id"));
    return el;
  }
  async function uploadFile(file) {
    const types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm"];
    if (!types.includes(file.type)) throw Error("\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A JPG, PNG, WebP, GIF, AVIF, MP4 \u0E41\u0E25\u0E30 WebM");
    if (file.size > 20971520) throw Error("\u0E44\u0E1F\u0E25\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 20 MB");
    return (await api("upload", {}, file)).url;
  }
  function renderStores() {
    const q = $("search").value.toLocaleLowerCase(), list = catalog.stores.filter((s) => JSON.stringify(effectiveStore(s, working.stores?.[s.id])).toLocaleLowerCase().includes(q));
    $("field-count").textContent = `${list.length} \u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32 \xB7 \u0E41\u0E01\u0E49\u0E0A\u0E37\u0E48\u0E2D \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 \u0E41\u0E25\u0E30\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23`;
    $("field-list").replaceChildren();
    let offset = 0;
    const batch = () => {
      for (const s of list.slice(offset, offset + 15)) {
        const el = node("article", void 0, "field"), current = effectiveStore(s, working.stores?.[s.id]);
        el.append(node("h3", s.id + ". " + s.name, "store-title"), node("p", s.province + " \xB7 " + s.region, "store-sub"));
        for (const [k, title] of Object.entries({ name: "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32", address: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48", phone: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23" })) {
          const label = node("label", title, "store-field"), input = node(k === "address" ? "textarea" : "input");
          input.value = current[k] || "";
          input.setAttribute("aria-label", title + " \xB7 " + s.name);
          input.oninput = () => {
            working.stores ??= {};
            working.stores[s.id] ??= {};
            if (input.value === s[k]) delete working.stores[s.id][k];
            else working.stores[s.id][k] = input.value;
            if (!Object.keys(working.stores[s.id]).length) delete working.stores[s.id];
            status();
            sync(true);
          };
          label.append(input);
          el.append(label);
        }
        $("field-list").append(el);
      }
      offset += 15;
      if (offset < list.length) {
        const b = node("button", "\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E16\u0E31\u0E14\u0E44\u0E1B", "wide");
        b.onclick = () => {
          b.remove();
          batch();
        };
        $("field-list").append(b);
      }
    };
    batch();
  }
  async function save(target) {
    if (busy) return false;
    busy = true;
    status();
    try {
      validateDocument(working, catalog);
      const { state } = await api("save", { target, document: working, revision: states[target].revision });
      if (!state) throw Error("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      states[target] = state;
      if (target === "draft") saved = JSON.stringify(working);
      toast(target === "draft" ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27" : "\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E41\u0E25\u0E49\u0E27");
      return true;
    } catch (e) {
      toast(message(e));
      return false;
    } finally {
      busy = false;
      status();
    }
  }
  $("save-draft").onclick = () => save("draft");
  $("publish").onclick = () => {
    try {
      validateDocument(working, catalog);
    } catch (e) {
      toast(message(e));
      return;
    }
    $("publish-summary").textContent = `\u0E1B\u0E23\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A ${Object.keys(working.fields).length} \u0E08\u0E38\u0E14 \xB7 \u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32 ${Object.keys(working.stores || {}).length} \u0E23\u0E49\u0E32\u0E19`;
    $("publish-dialog").showModal();
  };
  $("confirm-publish").onclick = async () => {
    if (JSON.stringify(working) !== saved && !await save("draft")) return;
    if (await save("live")) $("publish-dialog").close();
  };
  $("clear-selection").onclick = () => {
    selection = null;
    render();
  };
  $("search").oninput = render;
  $("kind").onchange = render;
  $("content-nav").onclick = () => setPage(page);
  $("media-nav").onclick = () => {
    view = "media";
    selection = null;
    $("page-title").textContent = "\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E41\u0E25\u0E30\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D";
    $("editor-title").textContent = "\u0E23\u0E39\u0E1B\u0E41\u0E25\u0E30\u0E1E\u0E37\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32";
    $("search").value = "";
    $("kind").value = "all";
    nav("media-nav");
    render();
  };
  $("stores-nav").onclick = () => {
    view = "stores";
    selection = null;
    page = "stores";
    $("page-title").textContent = "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32";
    $("editor-title").textContent = "\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A";
    $("search").value = "";
    $("editor-layout").hidden = false;
    $("history-panel").hidden = true;
    nav("stores-nav");
    render();
    reload();
  };
  $("inspect").onclick = () => {
    inspect = !inspect;
    $("inspect").classList.toggle("selected", inspect);
    $("inspect").setAttribute("aria-pressed", String(inspect));
    $("inspect").textContent = inspect ? "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E38\u0E14\u0E1A\u0E19\u0E40\u0E27\u0E47\u0E1A" : "\u0E17\u0E14\u0E25\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E40\u0E27\u0E47\u0E1A";
    send("cs-cms-inspect", { enabled: inspect });
  };
  for (const type of ["desktop", "mobile"]) $(type).onclick = () => {
    $("preview").parentElement.classList.toggle("mobile", type === "mobile");
    for (const x of ["desktop", "mobile"]) {
      $(x).classList.toggle("selected", x === type);
      $(x).setAttribute("aria-pressed", String(x === type));
    }
  };
  $("reload-preview").onclick = reload;
  $("history-nav").onclick = async () => {
    try {
      const { history: data } = await api("history");
      $("editor-layout").hidden = true;
      $("history-panel").hidden = false;
      $("page-title").textContent = "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01";
      nav("history-nav");
      $("history-list").replaceChildren();
      if (!data.length) $("history-list").append(node("p", "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E09\u0E1A\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48", "empty"));
      for (const h of data) {
        const row = node("div", void 0, "history-entry"), label = node("div", `${h.state === "live" ? "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48" : "\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07"} \xB7 \u0E23\u0E38\u0E48\u0E19 ${h.revision}`);
        label.append(node("small", new Date(h.saved_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })));
        const restore = node("button", "\u0E40\u0E23\u0E35\u0E22\u0E01\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07");
        restore.onclick = async () => {
          if (JSON.stringify(working) !== saved && !confirm("\u0E21\u0E35\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E41\u0E17\u0E19\u0E17\u0E35\u0E48\u0E14\u0E49\u0E27\u0E22\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) return;
          try {
            const data2 = await api("restore", { id: h.id });
            working = copy(data2.document);
            setPage(page);
            status();
            toast("\u0E40\u0E23\u0E35\u0E22\u0E01\u0E09\u0E1A\u0E31\u0E1A\u0E40\u0E01\u0E48\u0E32\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48");
          } catch (e) {
            toast(message(e));
          }
        };
        row.append(label, restore);
        $("history-list").append(row);
      }
    } catch (e) {
      toast(message(e));
    }
  };
  $("back-editor").onclick = () => setPage(page);
  $("sign-out").onclick = async () => {
    if (JSON.stringify(working) !== saved && !confirm("\u0E21\u0E35\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) return;
    forgetEditorLink();
    location.reload();
  };
  window.addEventListener("beforeunload", (e) => {
    if (states && JSON.stringify(working) !== saved) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  enter().catch((e) => $("auth-message").textContent = message(e));
})();
