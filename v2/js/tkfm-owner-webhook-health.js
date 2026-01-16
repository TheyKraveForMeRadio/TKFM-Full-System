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

  async function refresh(){
    try{
      if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing. Ensure /js/tkfm-functions-client.js is loaded.");
      const ownerKey = ($("ownerKey").value||"").trim();
      if(!ownerKey) throw new Error("Missing owner key.");
      const scope = ($("scope").value||"sponsor").trim();

      setMsg("info", "Loading…");

      const r = await window.TKFMCallFn("owner-webhook-health", { scope }, {
        headers: { "content-type":"application/json", "x-tkfm-owner-key": ownerKey }
      });

      const data = r.data || {};
      $("mode").textContent = data.stripe_mode || "—";
      const deliveries = data.deliveries || [];
      $("count").textContent = String(deliveries.length);

      const rows = $("rows");
      rows.innerHTML = "";

      if(deliveries.length === 0){
        rows.innerHTML = `<tr><td colspan="7" class="small">No deliveries recorded yet. After deploy, trigger a test event in Stripe Webhooks.</td></tr>`;
      }else{
        for(const d of deliveries){
          rows.innerHTML += `<tr>
            <td class="mono">${esc(d.at||"")}</td>
            <td>${esc(d.type||"")}</td>
            <td class="mono">${esc(d.lookupKey||d.lookup_key||"")}</td>
            <td>${esc(d.awarded !== undefined ? String(d.awarded) : "")}</td>
            <td class="mono">${esc(d.customerId||d.customer||"")}</td>
            <td class="mono">${esc(d.id||"")}</td>
            <td class="small">${esc(d.error||"")}</td>
          </tr>`;
        }
      }

      setMsg("info", `Loaded ${deliveries.length} deliveries. (via ${r.used})`);
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

    $("refresh").addEventListener("click", refresh);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", wire);
  }else{
    wire();
  }
})();