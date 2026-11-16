(() => {
  // cms/validation.js
  function safeURL(value, kind = "image") {
    if (typeof value !== "string" || value.length > 2e4 || /[\u0000-\u001f]/.test(value)) return false;
    if (kind === "link" && /^(?:#[\w-]+|mailto:[^\s<>]+|tel:[+\d ()-]+)$/.test(value)) return true;
    if (!value) return kind === "link";
    if (/^(?!\/\/)(?:\.?\.?\/)?[a-zA-Z0-9_\-/]+(?:\.[a-zA-Z0-9]+)?(?:[?#][^\s<>]*)?$/.test(value)) return true;
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }
  function effectiveStore(base2, patch) {
    return { ...base2, ...Object.fromEntries(Object.entries(patch || {}).filter(([k, v]) => ["name", "address", "phone"].includes(k) && typeof v === "string")) };
  }

  // cms/runtime.js
  var tag = document.currentScript || document.querySelector('script[src$="cms-runtime.js"]');
  var base = new URL(".", tag.src);
  window.CSCMS = { value: (id, fallback) => fallback, storeData: (data) => data };
  function startOriginal(after) {
    if (document.getElementById("cms-interactions-loader")) return;
    const s = document.createElement("script");
    s.id = "cms-interactions-loader";
    s.src = new URL("cms-original-interactions.js", base);
    s.onload = after || null;
    document.body.appendChild(s);
  }
  (async () => {
    const vectorStyle = document.createElement("style");
    vectorStyle.textContent = "[data-cms-vector-replaced]> *{visibility:hidden!important}";
    document.head.appendChild(vectorStyle);
    const preview = window.parent !== window && new URLSearchParams(location.search).get("cms-preview") === "1";
    await new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = new URL("cms-config.js", base);
      s.onload = s.onerror = resolve;
      document.head.appendChild(s);
    });
    const config = window.CSCMS_CONFIG, catalog = await fetch(new URL("cms-catalog.json", base)).then((r) => {
      if (!r.ok) throw Error("Cannot load catalogue");
      return r.json();
    }), byId = new Map(catalog.fields.map((f) => [f.id, f]));
    let content = { fields: {} }, observer, selected = null, inspect = false;
    if (preview) content = await new Promise((resolve) => {
      const receive = (e) => {
        if (e.source === parent && e.origin === location.origin && e.data?.type === "cs-cms-content") {
          window.removeEventListener("message", receive);
          resolve(e.data.document || { fields: {} });
        }
      };
      window.addEventListener("message", receive);
      parent.postMessage({ type: "cs-cms-bootstrap" }, location.origin);
    });
    else if (config) try {
      const r = await fetch(config.url + "/rest/v1/cms_states?id=eq.live&select=document", { headers: { apikey: config.key }, cache: "no-store", signal: AbortSignal.timeout(3500) });
      if (r.ok) {
        const data = await r.json();
        if (data[0]) content = data[0].document;
      }
    } catch {
    }
    const originals = /* @__PURE__ */ new WeakMap(), attrOriginals = /* @__PURE__ */ new WeakMap(), dynamic = catalog.fields.filter((f) => f.kind === "dynamic").sort((a, b) => b.default.length - a.default.length), dynamicMedia = catalog.fields.filter((f) => f.kind === "dynamic-media");
    function value(id, fallback) {
      const f = byId.get(id), v = content.fields?.[id];
      return typeof v === "string" && (!f || !["media", "background", "dynamic-media", "vector"].includes(f.kind) || safeURL(v)) ? v : fallback;
    }
    window.CSCMS = { value, storeData: (data) => data.map((s) => effectiveStore(s, content.stores?.[s.id])) };
    const json = document.getElementById("hp97-store-data");
    if (json) json.textContent = JSON.stringify(window.CSCMS.storeData(catalog.stores));
    function translate(text) {
      for (const f of dynamic) {
        const v = content.fields?.[f.id];
        if (typeof v === "string" && v !== f.default && f.default.trim()) text = text.split(f.default).join(v);
      }
      return text;
    }
    function process(n) {
      if (n.nodeType === 3) {
        if (!n.parentElement || n.parentElement.closest("script,style,textarea")) return;
        let rec = originals.get(n);
        if (!rec || n.nodeValue !== rec.applied) rec = { original: n.nodeValue };
        const next = translate(rec.original);
        if (n.nodeValue !== next) n.nodeValue = next;
        rec.applied = next;
        originals.set(n, rec);
        return;
      }
      if (n.nodeType !== 1 || n.matches("script,style")) return;
      for (const a of ["src", "poster", "alt", "title", "placeholder", "aria-label"]) {
        const current = n.getAttribute(a);
        if (current === null) continue;
        const records = attrOriginals.get(n) || {}, rec = records[a]?.applied === current ? records[a] : { original: current };
        let next = translate(rec.original);
        if (["src", "poster"].includes(a)) {
          const f = dynamicMedia.find((f2) => f2.default === rec.original);
          if (f) next = value(f.id, rec.original);
        }
        if (next !== current) n.setAttribute(a, next);
        records[a] = { original: rec.original, applied: next };
        attrOriginals.set(n, records);
      }
      for (const child of n.childNodes) process(child);
    }
    function observe() {
      observer?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["src", "poster", "alt", "title", "placeholder", "aria-label"] });
    }
    function apply() {
      observer?.disconnect();
      for (const f of catalog.fields) {
        const v = value(f.id, f.default);
        if (f.kind === "background") {
          if (v !== f.default && safeURL(v)) document.documentElement.style.setProperty("--cms-" + f.id, `url(${JSON.stringify(v)})`);
          else document.documentElement.style.removeProperty("--cms-" + f.id);
          continue;
        }
        if (f.kind === "pseudo") {
          if (v !== f.default) document.documentElement.style.setProperty("--cms-" + f.id, JSON.stringify(v));
          else document.documentElement.style.removeProperty("--cms-" + f.id);
          continue;
        }
        if (!f.selector) continue;
        const el = document.querySelector(f.selector);
        if (!el) continue;
        if (f.kind === "vector") {
          if (v !== f.default && safeURL(v)) {
            el.style.backgroundImage = `url(${JSON.stringify(v)})`;
            el.style.backgroundSize = "contain";
            el.style.backgroundRepeat = "no-repeat";
            el.style.backgroundPosition = "center";
            el.setAttribute("data-cms-vector-replaced", "");
          } else {
            el.style.removeProperty("background-image");
            el.removeAttribute("data-cms-vector-replaced");
          }
          continue;
        }
        if (f.kind === "text") {
          const n = el.childNodes[f.index];
          if (n?.nodeType === 3) {
            n.nodeValue = v;
            originals.set(n, { original: v, applied: v });
          }
        } else if (["attribute", "media", "link"].includes(f.kind)) {
          if (v !== f.default && (f.kind === "media" || f.kind === "link") && !safeURL(v, f.kind === "link" ? "link" : "image")) continue;
          el.setAttribute(f.attr, v);
          if (f.kind === "link" && f.route) {
            if (v === f.default) el.dataset.route = f.route;
            else if (v.startsWith("#") && catalog.pages[v.slice(1)]) el.dataset.route = v.slice(1);
            else el.removeAttribute("data-route");
          }
          const records = attrOriginals.get(el) || {};
          records[f.attr] = { original: v, applied: v };
          attrOriginals.set(el, records);
          if (el.tagName === "VIDEO" && f.attr === "src" && v !== f.default) el.load();
        }
      }
      process(document.body);
      observe();
    }
    observer = new MutationObserver((records) => {
      observer.disconnect();
      for (const r of records) if (r.type === "childList") for (const n of r.addedNodes) process(n);
      else process(r.target);
      observe();
    });
    apply();
    startOriginal(() => {
      process(document.body);
      if (preview) parent.postMessage({ type: "cs-cms-ready" }, location.origin);
    });
    if (preview) {
      const s = document.createElement("style");
      s.textContent = "[data-cms-hover]{outline:3px solid #e93555!important;outline-offset:3px!important;cursor:pointer!important}";
      document.head.appendChild(s);
      window.addEventListener("message", (e) => {
        if (e.source !== parent || e.origin !== location.origin) return;
        const m = e.data;
        if (m?.type === "cs-cms-content") {
          content = m.document || { fields: {} };
          apply();
        }
        if (m?.type === "cs-cms-inspect") {
          inspect = !!m.enabled;
          selected?.removeAttribute("data-cms-hover");
          selected = null;
        }
        if (m?.type === "cs-cms-focus") {
          const f = byId.get(m.id), el = f?.selector && document.querySelector(f.selector);
          selected?.removeAttribute("data-cms-hover");
          if (el) {
            el.setAttribute("data-cms-hover", "");
            el.scrollIntoView({ block: "center", behavior: "smooth" });
            selected = el;
          }
        }
      });
      document.addEventListener("pointerover", (e) => {
        if (!inspect) return;
        selected?.removeAttribute("data-cms-hover");
        selected = e.target.closest("[data-cms-id]");
        selected?.setAttribute("data-cms-hover", "");
      }, true);
      document.addEventListener("click", (e) => {
        if (!inspect) return;
        const target = e.target.closest("[data-cms-id]");
        if (!target) return;
        const matches = catalog.fields.filter((f) => f.selector === `[data-cms-id="${target.dataset.cmsId}"]`);
        if (matches.length) {
          e.preventDefault();
          e.stopImmediatePropagation();
          parent.postMessage({ type: "cs-cms-select", ids: matches.map((f) => f.id) }, location.origin);
        }
      }, true);
    }
  })().catch((error) => {
    console.error("CMS adapter failed; using approved baseline", error);
    startOriginal();
  });
})();
