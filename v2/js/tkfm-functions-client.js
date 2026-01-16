(function(){
  // TKFM Functions Client Helper
  // Fixes Vite 5173 -> /.netlify/functions/* 404 by falling back to local functions server :9999.
  // Usage: await window.TKFMCallFn("create-checkout-session", {lookup_key:"..."})
  const REL_BASE = "/.netlify/functions";
  const LOCAL_BASE = "http://localhost:9999/.netlify/functions";

  function safeJson(txt){
    try{ return JSON.parse(txt); }catch(e){ return { ok:false, raw: txt }; }
  }

  async function fetchText(url, opts){
    const res = await fetch(url, opts);
    const txt = await res.text();
    return { res, txt };
  }

  async function callFn(name, payload, opts){
    const o = Object.assign({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload || {})
    }, opts || {});

    const attempts = [];

    // 1) Try relative (works on deploy + if proxy is configured)
    try{
      const a = await fetchText(`${REL_BASE}/${name}`, o);
      attempts.push({ url: `${REL_BASE}/${name}`, status: a.res.status, ok: a.res.ok });
      if(a.res.ok){
        return { data: safeJson(a.txt), used: "relative", url: `${REL_BASE}/${name}`, attempts };
      }
      // Common in Vite 5173: 404 because no proxy -> fallthrough
    }catch(e){
      attempts.push({ url: `${REL_BASE}/${name}`, status: 0, ok: false, error: String(e && e.message || e) });
    }

    // 2) Fallback to local functions server (stable Windows mode)
    const b = await fetchText(`${LOCAL_BASE}/${name}`, o);
    attempts.push({ url: `${LOCAL_BASE}/${name}`, status: b.res.status, ok: b.res.ok });
    if(!b.res.ok){
      const d = safeJson(b.txt);
      const msg = (d && (d.error || d.message)) ? (d.error || d.message) : `HTTP ${b.res.status}`;
      const err = new Error(msg);
      err.attempts = attempts;
      throw err;
    }
    return { data: safeJson(b.txt), used: "local9999", url: `${LOCAL_BASE}/${name}`, attempts };
  }

  window.TKFMCallFn = callFn;
  window.__TKFM_FUNCTIONS__ = { REL_BASE, LOCAL_BASE };
})();