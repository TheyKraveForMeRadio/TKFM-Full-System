/* TKFM Featured Rail — Stability + Cache (Radio TV)
   Goals:
   - Never leave radio-tv.html blank if the Featured API fails.
   - Cache last-good Featured payload in localStorage.
   - On load: show cached items fast, then refresh from API.
   - If the existing rail already rendered, do NOTHING (no double render).
   Depends on:
   - Host container: #tkfmFeaturedRailHost
   - API: /.netlify/functions/media-feature-get  (returns featured items)
*/

(function(){
  const API = "/.netlify/functions/media-feature-get";
  const CACHE_KEY = "tkfm_featured_cache_v1";
  const CACHE_TS  = "tkfm_featured_cache_ts_v1";
  const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours
  const TIMEOUT_MS = 7000;

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  function safeJsonParse(s){ try { return JSON.parse(s); } catch(e){ return null; } }

  function fetchWithTimeout(url, opts){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);
    return fetch(url, Object.assign({}, opts||{}, { signal: ctrl.signal }))
      .finally(()=>clearTimeout(t));
  }

  function normalizeItems(raw){
    // Accept multiple shapes: {items:[...]}, [...], {featured:[...]}
    let items = [];
    if (Array.isArray(raw)) items = raw;
    else if (raw && Array.isArray(raw.items)) items = raw.items;
    else if (raw && Array.isArray(raw.featured)) items = raw.featured;
    else if (raw && Array.isArray(raw.data)) items = raw.data;
    return items.filter(Boolean).map(it => ({
      id: it.id || it._id || (it.type||"item")+"_"+(it.title||"").slice(0,24),
      type: (it.type || it.lane || it.category || "featured").toString(),
      title: (it.title || it.name || "Untitled").toString(),
      url: (it.url || it.link || it.href || "").toString(),
      thumb: (it.thumb || it.thumbnail || it.image || "").toString(),
      blurb: (it.blurb || it.desc || it.description || "").toString()
    }));
  }

  function ensureStyles(){
    if (document.getElementById("tkfmFeaturedFallbackStyles")) return;
    const st = document.createElement("style");
    st.id = "tkfmFeaturedFallbackStyles";
    st.textContent = `
      .tkfmFeatFallbackWrap{
        max-width: 1200px;
        margin: 12px auto 12px;
        border-radius: 22px;
        border: 1px solid rgba(148,163,184,.18);
        background: rgba(2,6,23,.55);
        padding: 14px;
        color: #e2e8f0;
      }
      .tkfmFeatFallbackTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .tkfmFeatFallbackPill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(34,211,238,.95)}
      .tkfmFeatFallbackHint{color:rgba(226,232,240,.72);font-size:.86rem;max-width:860px;line-height:1.5}
      .tkfmFeatFallbackBtn{
        border-radius: 999px;
        padding: 10px 12px;
        border: 1px solid rgba(34,211,238,.35);
        background: rgba(2,6,23,.65);
        color:#e2e8f0;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
        font-size: .72rem;
        cursor: pointer;
        white-space: nowrap;
      }
      .tkfmFeatFallbackBtn:hover{border-color:rgba(34,211,238,.55)}
      .tkfmFeatFallbackGrid{
        display:grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 12px;
      }
      @media(min-width: 980px){ .tkfmFeatFallbackGrid{grid-template-columns: repeat(4, 1fr)} }
      .tkfmFeatFallbackCard{
        border-radius: 18px;
        border: 1px solid rgba(34,211,238,.12);
        background: rgba(2,6,23,.35);
        padding: 12px;
      }
      .tkfmFeatFallbackTitle{font-weight:900}
      .tkfmFeatFallbackMeta{margin-top:6px;color:rgba(226,232,240,.72);font-size:.84rem;line-height:1.45}
      .tkfmFeatFallbackType{display:inline-block;margin-top:8px;padding:5px 9px;border-radius:999px;border:1px solid rgba(250,204,21,.25);background:rgba(250,204,21,.08);color:#fde68a;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase}
      .tkfmFeatFallbackLink{color:rgba(147,197,253,.95);font-weight:900;text-decoration:none}
    `;
    document.head.appendChild(st);
  }

  function hasRealRailRendered(host){
    // If the real rail already rendered cards, do not interfere.
    const cards = $all(".tkfmFeatCard", host);
    return cards.length > 0;
  }

  function renderFallback(host, items, note){
    ensureStyles();

    // Don't overwrite real rail if it exists.
    if (hasRealRailRendered(host)) return;

    // Create an internal fallback container to avoid clobbering future renders.
    let wrap = document.getElementById("tkfmFeaturedFallbackWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "tkfmFeaturedFallbackWrap";
      wrap.className = "tkfmFeatFallbackWrap";
      host.innerHTML = "";
      host.appendChild(wrap);
    }

    const safeItems = (items||[]).slice(0, 12);
    const gridCards = safeItems.map(it => {
      const u = it.url ? `<a class="tkfmFeatFallbackLink" href="${it.url}" target="_blank" rel="noopener">Open</a>` : `<span style="opacity:.6">No link</span>`;
      const bl = it.blurb ? it.blurb : "Featured item";
      return `
        <div class="tkfmFeatFallbackCard" data-type="${escapeHtml(it.type)}">
          <div class="tkfmFeatFallbackTitle">${escapeHtml(it.title)}</div>
          <div class="tkfmFeatFallbackMeta">${escapeHtml(bl)}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px">
            <span class="tkfmFeatFallbackType">${escapeHtml(it.type)}</span>
            ${u}
          </div>
        </div>
      `;
    }).join("");

    wrap.innerHTML = `
      <div class="tkfmFeatFallbackTop">
        <div>
          <div class="tkfmFeatFallbackPill">FEATURED • SAFE MODE</div>
          <div class="tkfmFeatFallbackHint">
            ${escapeHtml(note || "Loading Featured…")}
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="tkfmFeatFallbackBtn" id="tkfmFeatRetryBtn" type="button">Retry</button>
          <a class="tkfmFeatFallbackBtn" href="/pricing.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center">Buy Placement</a>
        </div>
      </div>

      <div class="tkfmFeatFallbackGrid">
        ${gridCards || `<div class="tkfmFeatFallbackHint">No cached Featured items yet. Add some in the owner inbox → approve to Featured.</div>`}
      </div>
    `;

    const b = document.getElementById("tkfmFeatRetryBtn");
    if (b) b.onclick = ()=>refresh(host, true);
  }

  function escapeHtml(s){
    return String(s||"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function loadCache(){
    const ts = parseInt(localStorage.getItem(CACHE_TS)||"0", 10);
    const raw = safeJsonParse(localStorage.getItem(CACHE_KEY)||"");
    const items = normalizeItems(raw);
    const fresh = ts && (Date.now() - ts) < MAX_AGE_MS;
    return { ts, items, fresh };
  }

  function saveCache(raw){
    try{
      localStorage.setItem(CACHE_KEY, JSON.stringify(raw));
      localStorage.setItem(CACHE_TS, String(Date.now()));
    }catch(e){}
  }

  async function refresh(host, userRetry){
    // If real rail is already present, no need to fetch.
    if (hasRealRailRendered(host)) return;

    const cache = loadCache();
    if (cache.items.length && !userRetry){
      renderFallback(host, cache.items, cache.fresh
        ? "Showing cached Featured while we refresh…"
        : "Showing older cached Featured while we refresh…");
    } else if (!cache.items.length){
      renderFallback(host, [], "Loading Featured…");
    }

    try{
      const res = await fetchWithTimeout(API, { headers: { "accept": "application/json" } });
      if (!res.ok) throw new Error("HTTP "+res.status);
      const raw = await res.json();
      const items = normalizeItems(raw);

      // If existing rail rendered during fetch, do nothing.
      if (hasRealRailRendered(host)) return;

      if (items.length){
        saveCache(raw);
        // Minimal safe render; real rail can still render later if it loads.
        renderFallback(host, items, "Featured loaded. If you don’t see the full rail UI, refresh the page.");
      } else {
        renderFallback(host, cache.items, "No Featured items returned yet. Add items → approve to Featured.");
      }
    }catch(e){
      const msg = (e && e.name === "AbortError")
        ? "Featured timed out. Showing cached items."
        : "Featured failed to load. Showing cached items.";
      renderFallback(host, loadCache().items, msg);
    }
  }

  function boot(){
    const host = document.getElementById("tkfmFeaturedRailHost");
    if (!host) return;

    // Wait a moment for the real Featured rail script to do its job first.
    setTimeout(()=>{
      if (!hasRealRailRendered(host)){
        refresh(host, false);
      }
    }, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
