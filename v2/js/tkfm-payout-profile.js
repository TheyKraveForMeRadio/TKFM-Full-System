(function(){
  const $=(id)=>document.getElementById(id);
  const KEY_EMAIL="tkfm_distribution_email";

  function esc(s){ return String(s||"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
  function setBox(ok, html){
    const el=$("out");
    el.className = ok ? "ok" : "warn";
    el.innerHTML = html;
  }
  function lower(s){ return String(s||"").trim().toLowerCase(); }

  async function getJSON(url){
    const res=await fetch(url,{cache:"no-store"});
    const txt=await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  async function postJSON(url, body){
    const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const txt=await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }

  function toggle(){
    const m = $("payout_method").value;
    $("paypalFields").style.display = (m==="PayPal") ? "block" : "none";
    $("achFields").style.display = (m==="ACH") ? "block" : "none";
  }

  async function load(){
    const email = lower($("email").value);
    if(!email){ setBox(false, "Enter email."); return; }
    const out = await getJSON("/.netlify/functions/payout-profiles?email="+encodeURIComponent(email));
    if(!out.ok || !out.data || !out.data.ok){ setBox(false, "Load failed."); return; }
    const p = out.data.profile;
    if(!p){ setBox(false, "No profile found yet."); return; }
    $("payee_name").value = p.payee_name || "";
    $("payout_method").value = p.payout_method || "PayPal";
    $("payout_handle").value = p.payout_handle || "";
    $("ach_routing_last4").value = p.ach_routing_last4 || "";
    $("ach_account_last4").value = p.ach_account_last4 || "";
    toggle();
    setBox(true, "Loaded ✅");
  }

  async function save(){
    const email = lower($("email").value);
    const payload = {
      email,
      payee_name: ($("payee_name").value||"").trim(),
      payout_method: ($("payout_method").value||"").trim(),
      payout_handle: ($("payout_handle").value||"").trim(),
      ach_routing_last4: ($("ach_routing_last4").value||"").trim(),
      ach_account_last4: ($("ach_account_last4").value||"").trim()
    };
    if(!payload.email || !payload.payout_method){ setBox(false, "Email + payout method required."); return; }
    const out = await postJSON("/.netlify/functions/payout-profiles", payload);
    if(!out.ok || !out.data || !out.data.ok){ setBox(false, "<b>Save failed</b><pre>"+esc(out.text)+"</pre>"); return; }
    try{ localStorage.setItem(KEY_EMAIL, payload.email); }catch(e){}
    setBox(true, "Saved ✅");
  }

  $("payout_method").addEventListener("change", toggle);
  $("loadBtn").addEventListener("click", load);
  $("saveBtn").addEventListener("click", save);

  try{ const e = localStorage.getItem(KEY_EMAIL) || ""; if(e) $("email").value = e; }catch(e){}
  toggle();
})();