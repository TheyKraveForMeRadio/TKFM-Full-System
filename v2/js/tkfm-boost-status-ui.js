// TKFM: Boost Status UI (user-facing)
// Shows active Boost entitlements + days left.
// Safe to include on rotation-boost.html + dashboard.html.
(function () {
  const PANEL_ID = 'tkfmBoostStatusPanel';
  const OUT_ID = 'tkfmBoostStatusOut';

  function qs(id){ return document.getElementById(id); }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function getStore(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  }
  function setStore(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  function pruneExpired(ent){
    const now = Date.now();
    let changed = false;
    const out = { ...(ent || {}) };
    for (const k of Object.keys(out)){
      const v = out[k];
      const exp = Number(v && v.expires_at ? v.expires_at : 0);
      if (exp && exp <= now){
        delete out[k];
        changed = true;
      }
    }
    if (changed) setStore('tkfm_boost_entitlements', out);
    return out;
  }

  function daysLeft(expiresAt){
    const now = Date.now();
    const ms = Number(expiresAt || 0) - now;
    if (!isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  }

  function fmtDate(ms){
    try{
      return new Date(Number(ms||0)).toLocaleString();
    }catch(e){
      return '';
    }
  }

  function render() {
    const panel = qs(PANEL_ID);
    const out = qs(OUT_ID);
    if (!panel || !out) return;

    let ent = getStore('tkfm_boost_entitlements', {});
    ent = pruneExpired(ent);

    const keys = Object.keys(ent || {});
    if (!keys.length) {
      out.innerHTML = `
        <div style="color:rgba(255,255,255,.75);font-size:13px;line-height:1.45;">
          No active Boost found.
        </div>
        <div style="margin-top:10px;">
          <a href="/rotation-boost.html" style="
            display:inline-flex;align-items:center;justify-content:center;gap:10px;
            padding:10px 12px;border-radius:14px;font-weight:900;text-decoration:none;
            background:linear-gradient(90deg,#a855f7,#ec4899);color:#020617;
            box-shadow:0 10px 24px rgba(0,0,0,.35);
          ">Buy Boost</a>
        </div>
      `;
      return;
    }

    // Sort by soonest expiry
    keys.sort((a,b) => Number(ent[a]?.expires_at||0) - Number(ent[b]?.expires_at||0));

    const rows = keys.map(k => {
      const v = ent[k] || {};
      const exp = Number(v.expires_at || 0);
      const left = daysLeft(exp);
      const label = k === 'rotation_boost_7d' ? 'BOOST — 7 DAYS' : (k === 'rotation_boost_30d' ? 'BOOST — 30 DAYS' : k);
      return `
        <div style="
          border:1px solid rgba(148,163,184,.18);
          background:rgba(2,6,23,.55);
          border-radius:16px;
          padding:12px;
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          align-items:center;
          justify-content:space-between;
        ">
          <div>
            <div style="letter-spacing:.12em;font-size:12px;color:#22d3ee;text-transform:uppercase;">Active</div>
            <div style="margin-top:4px;font-weight:1000;font-size:16px;">${esc(label)}</div>
            <div style="margin-top:6px;color:rgba(255,255,255,.70);font-size:12px;">
              Expires: <b>${esc(fmtDate(exp))}</b>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="
              padding:8px 10px;border-radius:999px;
              border:1px solid rgba(34,211,238,.30);
              background:rgba(15,23,42,.55);
              font-weight:900;
            ">${left} day${left===1?'':'s'} left</div>

            <a href="/rotation-boost.html" style="
              display:inline-flex;align-items:center;justify-content:center;gap:10px;
              padding:10px 12px;border-radius:14px;font-weight:900;text-decoration:none;
              background:linear-gradient(90deg,#22d3ee,#3b82f6);color:#020617;
              box-shadow:0 10px 24px rgba(0,0,0,.35);
            ">Submit / Manage</a>
          </div>
        </div>
      `;
    }).join('\n');

    out.innerHTML = rows;
  }

  function boot(){
    render();
    // refresh countdown every 60s
    setInterval(render, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
