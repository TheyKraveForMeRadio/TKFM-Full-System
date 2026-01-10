/* TKFM Featured Rail (global)
   - Pulls featured items from /.netlify/functions/media-feature-get
   - Renders a Featured rail on pages that include #tkfmFeaturedRailHost
   - On radio-tv.html: clicking "TV" items loads into #tvFrame
   - Auto-rotates Featured TV items on a timer (pauses if user clicks)
*/
(function(){
  const FEED_URL = "/.netlify/functions/media-feature-get";
  const ROTATE_MS = 45000; // 45s

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function normalizeItems(data){
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.featured)) return data.featured;
    if (Array.isArray(data.results)) return data.results;
    return [];
  }

  function typeOf(it){
    const t = (it && (it.type || it.kind || it.mediaType)) || "";
    return String(t).toLowerCase();
  }

  function urlOf(it){
    return (it && (it.url || it.link || it.href || it.src)) ? String(it.url || it.link || it.href || it.src) : "";
  }

  function titleOf(it){
    return String((it && (it.title || it.name || it.label)) || "Featured");
  }

  async function fetchFeatured(){
    const res = await fetch(FEED_URL, { headers: { "accept":"application/json" } });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error((data && data.error) || "featured_fetch_failed");
    return normalizeItems(data);
  }

  function buildRail(host, items){
    host.innerHTML = "";
    host.setAttribute("data-tkfm-featured-rail","1");

    const tvItems = items.filter(it => typeOf(it).includes("tv") || typeOf(it).includes("video") || typeOf(it).includes("visual"));
    const podItems = items.filter(it => typeOf(it).includes("podcast"));
    const pressItems = items.filter(it => typeOf(it).includes("press"));
    const socialItems = items.filter(it => typeOf(it).includes("social"));

    const wrap = document.createElement("section");
    wrap.className = "tkfmFeatWrap";
    wrap.innerHTML = `
      <div class="tkfmFeatTop">
        <div>
          <div class="tkfmPill">FEATURED • LIVE NOW</div>
          <div class="tkfmFeatTitle">Top placements pulled from your Featured queue.</div>
          <div class="tkfmFeatSub">Owner approves → it appears here instantly. TV items load into the main screen.</div>
        </div>
        <div class="tkfmFeatStatus" id="tkfmFeatStatus">Loading…</div>
      </div>

      <div class="tkfmFeatGrid">
        <div class="tkfmFeatCol">
          <div class="tkfmFeatColHead">
            <span class="tkfmPill tkfmPillCyan">FEATURED TV</span>
            <span class="tkfmTiny">${tvItems.length} items</span>
          </div>
          <div class="tkfmFeatList" id="tkfmFeatTV"></div>
        </div>

        <div class="tkfmFeatCol">
          <div class="tkfmFeatColHead">
            <span class="tkfmPill tkfmPillPink">FEATURED PODCASTS</span>
            <span class="tkfmTiny">${podItems.length} items</span>
          </div>
          <div class="tkfmFeatList" id="tkfmFeatPod"></div>
        </div>

        <div class="tkfmFeatCol tkfmFeatColWide">
          <div class="tkfmFeatColHead">
            <span class="tkfmPill tkfmPillGold">PRESS + SOCIAL</span>
            <span class="tkfmTiny">${pressItems.length + socialItems.length} items</span>
          </div>
          <div class="tkfmFeatList" id="tkfmFeatOther"></div>
        </div>
      </div>
    `;
    host.appendChild(wrap);

    const tvEl = wrap.querySelector("#tkfmFeatTV");
    const podEl = wrap.querySelector("#tkfmFeatPod");
    const otherEl = wrap.querySelector("#tkfmFeatOther");
    const statusEl = wrap.querySelector("#tkfmFeatStatus");

    function itemCard(it, badge){
      const t = esc(titleOf(it));
      const u = esc(urlOf(it));
      const lane = esc((it && it.lane) || "");
      return `
        <button class="tkfmFeatCard" type="button" data-url="${u}" data-type="${esc(typeOf(it))}">
          <div class="tkfmFeatCardTop">
            <div class="tkfmBadge">${esc(badge)}</div>
            <div class="tkfmTiny">${lane ? ("Lane: " + lane) : "&nbsp;"}</div>
          </div>
          <div class="tkfmFeatCardTitle">${t}</div>
          <div class="tkfmFeatCardUrl">${u || "—"}</div>
        </button>
      `;
    }

    tvEl.innerHTML = tvItems.slice(0, 8).map(it => itemCard(it, "TV")).join("") || `<div class="tkfmEmpty">No Featured TV yet.</div>`;
    podEl.innerHTML = podItems.slice(0, 8).map(it => itemCard(it, "POD")).join("") || `<div class="tkfmEmpty">No Featured Podcasts yet.</div>`;

    const other = [...pressItems.slice(0,4).map(it=>({it,b:"PRESS"})), ...socialItems.slice(0,4).map(it=>({it,b:"SOCIAL"}))];
    otherEl.innerHTML = other.map(x => itemCard(x.it, x.b)).join("") || `<div class="tkfmEmpty">No Press/Social featured yet.</div>`;

    statusEl.textContent = "Ready";

    return { tvItems, podItems, pressItems, socialItems, wrap };
  }

  function wireClicks(host){
    const tvFrame = document.getElementById("tvFrame");
    host.addEventListener("click", (e)=>{
      const btn = e.target.closest(".tkfmFeatCard");
      if (!btn) return;
      const url = btn.getAttribute("data-url") || "";
      if (!url) return;

      // If we're on radio-tv and it's a TV item, load in frame
      const isTV = (btn.getAttribute("data-type") || "").includes("tv") || (btn.getAttribute("data-type") || "").includes("video") || (btn.getAttribute("data-type") || "").includes("visual");
      if (tvFrame && isTV) {
        tvFrame.src = url;
        host.setAttribute("data-user-clicked","1");
        return;
      }

      // Otherwise open new tab
      window.open(url, "_blank", "noopener,noreferrer");
      host.setAttribute("data-user-clicked","1");
    });
    return tvFrame;
  }

  function startRotation(host, tvItems, tvFrame){
    if (!tvFrame || !tvItems || !tvItems.length) return;
    let idx = 0;

    function next(){
      // pause if user clicked
      if (host.getAttribute("data-user-clicked") === "1") return;
      const it = tvItems[idx % tvItems.length];
      const url = urlOf(it);
      if (url) tvFrame.src = url;
      idx++;
    }

    // initial load
    next();
    setInterval(next, ROTATE_MS);
  }

  function injectStyles(){
    if (document.getElementById("tkfmFeaturedRailStyles")) return;
    const css = `
      .tkfmFeatWrap{
        max-width: 1200px;
        margin: 12px auto 14px;
        padding: 14px;
        border-radius: 22px;
        background: rgba(2,6,23,.55);
        border: 1px solid rgba(148,163,184,.18);
      }
      .tkfmFeatTop{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .tkfmPill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(34,211,238,.9)}
      .tkfmPillCyan{color:rgba(34,211,238,.95)}
      .tkfmPillPink{color:rgba(236,72,153,.95)}
      .tkfmPillGold{color:rgba(250,204,21,.95)}
      .tkfmFeatTitle{font-weight:900;font-size:1.05rem;margin-top:6px}
      .tkfmFeatSub{color:rgba(226,232,240,.78);font-size:.9rem;margin-top:6px;max-width:820px}
      .tkfmFeatStatus{color:rgba(226,232,240,.72);font-size:.85rem}
      .tkfmFeatGrid{
        display:grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 12px;
      }
      @media (min-width: 980px){
        .tkfmFeatGrid{grid-template-columns: 1fr 1fr 1.2fr}
      }
      .tkfmFeatCol{border-radius:18px;border:1px solid rgba(34,211,238,.12);background:rgba(2,6,23,.35);padding:12px}
      .tkfmFeatColWide{border-color:rgba(250,204,21,.10)}
      .tkfmFeatColHead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .tkfmTiny{font-size:.75rem;color:rgba(226,232,240,.65)}
      .tkfmFeatList{display:grid;gap:10px;margin-top:10px}
      .tkfmFeatCard{
        text-align:left;
        width:100%;
        border-radius: 16px;
        border: 1px solid rgba(148,163,184,.18);
        background: rgba(2,6,23,.55);
        padding: 12px;
        cursor:pointer;
        transition: transform .12s ease, border-color .12s ease;
      }
      .tkfmFeatCard:hover{transform: translateY(-1px); border-color: rgba(34,211,238,.35)}
      .tkfmFeatCardTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .tkfmBadge{
        width:44px;height:34px;border-radius:12px;
        display:flex;align-items:center;justify-content:center;
        background: linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));
        border: 1px solid rgba(168,85,247,.35);
        color:#e2e8f0;font-weight:900;letter-spacing:.06em;
      }
      .tkfmFeatCardTitle{margin-top:8px;font-weight:900;color:#e2e8f0}
      .tkfmFeatCardUrl{margin-top:6px;font-size:.78rem;color:rgba(226,232,240,.65);word-break:break-word}
      .tkfmEmpty{color:rgba(226,232,240,.7);font-size:.85rem;padding:8px 2px}
    `;
    const st = document.createElement("style");
    st.id = "tkfmFeaturedRailStyles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  async function boot(){
    const host = document.getElementById("tkfmFeaturedRailHost");
    if (!host) return;

    injectStyles();

    try{
      const items = await fetchFeatured();
      const built = buildRail(host, items);
      const tvFrame = wireClicks(host);
      startRotation(host, built.tvItems, tvFrame);
    } catch(e){
      host.innerHTML = `
        <div class="tkfmFeatWrap">
          <div class="tkfmPill">FEATURED • LIVE NOW</div>
          <div class="tkfmFeatTitle">Featured queue unavailable</div>
          <div class="tkfmFeatSub">Check media-feature-get function + store key.</div>
        </div>
      `;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
