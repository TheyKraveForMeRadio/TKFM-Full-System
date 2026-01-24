(function(){
  const $=(id)=>document.getElementById(id);
  function esc(s){ return String(s||"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  async function getJSON(url, key){
    const res = await fetch(url, { cache:"no-store", headers: key?{"x-tkfm-owner-key":key}:{ } });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }

  async function load(){
    const key = ($("ownerKey").value||"").trim();
    const out = await getJSON("/.netlify/functions/payout-profiles?limit=500", key);
    if(!out.ok || !out.data || !out.data.ok){
      $("out").innerHTML = "Load failed.";
      return;
    }
    const items = out.data.items || [];
    if(!items.length){ $("out").innerHTML = "No profiles yet."; return; }
    $("out").innerHTML = items.slice(0,500).map(x=>{
      const p = x.profile || {};
      const method = esc(p.payout_method||"");
      const handle = esc(p.payout_handle||"");
      const ach = (method==="ACH") ? ("routing ****"+esc(p.ach_routing_last4||"")+" • acct ****"+esc(p.ach_account_last4||"")) : "";
      const payee = esc(p.payee_name||"");
      return `<div style="margin-top:8px"><b>${esc(x.email)}</b> • ${method} • ${payee} ${handle?("• "+handle):""} ${ach?("• "+ach):""}</div>`;
    }).join("");
  }

  $("loadBtn").addEventListener("click", load);
})();