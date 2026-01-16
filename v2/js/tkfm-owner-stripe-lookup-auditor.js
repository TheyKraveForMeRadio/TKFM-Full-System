(function(){
  const $ = (id)=>document.getElementById(id);
  const LS_KEY = "tkfm_owner_key";

  function setMsg(kind, text){
    const el = $("msg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function money(unitAmount, currency){
    if(unitAmount === null || unitAmount === undefined) return "";
    const c = (currency||"").toUpperCase();
    const v = Number(unitAmount);
    if(!Number.isFinite(v)) return "";
    // Stripe amounts are in cents for USD
    return c ? `${(v/100).toFixed(2)} ${c}` : String(v);
  }

  async function run(){
    try{
      if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing. Ensure /js/tkfm-functions-client.js is loaded.");
      const ownerKey = ($("ownerKey").value||"").trim();
      if(!ownerKey) throw new Error("Missing owner key.");

      const lines = ($("keys").value||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      if(lines.length === 0) throw new Error("No lookup keys provided.");

      setMsg("info", "Running audit…");

      const r = await window.TKFMCallFn("owner-verify-lookup-keys", { lookup_keys: lines }, {
        headers: { "content-type":"application/json", "x-tkfm-owner-key": ownerKey }
      });

      const data = r.data || {};
      $("mode").textContent = data.stripe_mode || "—";
      $("prefix").textContent = data.stripe_key_prefix || "—";

      const rows = $("rows");
      rows.innerHTML = "";

      const results = data.results || [];
      for(const it of results){
        const found = it.found ? "YES" : "NO";
        const type = it.type || "";
        const amt = it.unit_amount !== undefined ? money(it.unit_amount, it.currency) : "";
        rows.innerHTML += `<tr>
          <td class="mono">${esc(it.lookup_key)}</td>
          <td>${it.found ? "✅" : "❌"} ${esc(found)}</td>
          <td class="mono">${esc(it.price_id||"")}</td>
          <td>${esc(type)}</td>
          <td>${esc(amt)}</td>
          <td>${esc((it.currency||"").toUpperCase())}</td>
          <td>${esc(it.product_name||it.product_id||"")}</td>
        </tr>`;
      }

      setMsg("info", `Complete. Checked ${results.length} lookup_keys. (via ${r.used})`);
    }catch(e){
      setMsg("warn", e.message);
    }
  }

  function wire(){
    const saved = localStorage.getItem(LS_KEY) || "";
    $("ownerKey").value = saved;

    $("saveKey").addEventListener("click", ()=>{
      const v = ($("ownerKey").value||"").trim();
      if(v) localStorage.setItem(LS_KEY, v);
      setMsg("info", "Saved owner key (per-port).");
    });

    $("clearKey").addEventListener("click", ()=>{
      localStorage.removeItem(LS_KEY);
      $("ownerKey").value = "";
      setMsg("info", "Cleared.");
    });

    $("run").addEventListener("click", run);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", wire);
  }else{
    wire();
  }
})();