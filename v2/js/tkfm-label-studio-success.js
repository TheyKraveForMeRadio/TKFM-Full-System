(function(){
  const $ = (id)=>document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || "";
  const planId = params.get("planId") || "";

  $("sess").textContent = sessionId || "—";
  $("plan").textContent = planId || "—";

  function fnUrl(path){
    const rel = `/.netlify/functions/${path}`;
    const direct = `http://localhost:9999/.netlify/functions/${path}`;
    return { rel, direct };
  }

  async function call(path, body){
    const { rel, direct } = fnUrl(path);
    const opts = { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body||{}) };
    let res = await fetch(rel, opts).catch(()=>null);
    if(!res || res.status===404) res = await fetch(direct, opts);
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt); }catch(e){ data = { ok:false, raw: txt }; }
    if(!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }

  function emailMsg(kind, text){
    const el = $("emailMsg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  async function run(){
    const status = $("status");
    if(!sessionId){
      status.className = "notice warn";
      status.textContent = "Missing session_id. Return from Stripe success URL.";
      return;
    }
    status.textContent = "Resolving customer + awarding Studio credits…";
    try{
      const award = await call("studio-award-from-session", { session_id: sessionId, planId });
      if(award.customerId){
        localStorage.setItem("tkfm_stripe_customer_id", award.customerId);
        $("cust").textContent = award.customerId;
      }
      status.className = "notice";
      status.textContent = `Credits awarded: ${award.awarded||0}. Creating restore link…`;

      const origin = window.location.origin;
      const linkRes = await call("studio-restore-link-create", {
        customerId: award.customerId,
        origin,
        return_to: "/label-studio-hub.html"
      });

      $("restoreLink").value = linkRes.link || "";
      status.textContent = "Complete. Restore link ready.";
    }catch(e){
      status.className = "notice warn";
      status.textContent = `Error: ${e.message}`;
    }
  }

  $("copyLink").addEventListener("click", async()=>{
    const link = ($("restoreLink").value||"").trim();
    if(!link) return;
    try{
      await navigator.clipboard.writeText(link);
      $("copyLink").textContent = "Copied";
      setTimeout(()=>($("copyLink").textContent="Copy Link"), 1200);
    }catch(e){}
  });

  $("sendEmail").addEventListener("click", async()=>{
    const email = ($("email").value||"").trim();
    const link = ($("restoreLink").value||"").trim();
    if(!email) return emailMsg("warn","Enter an email.");
    if(!link) return emailMsg("warn","Restore link not ready yet.");
    try{
      emailMsg("info","Sending…");
      const cid = $("cust").textContent.trim();
      const origin = window.location.origin;
      const res = await call("studio-restore-link-create", { customerId: cid, email, origin, return_to:"/label-studio-hub.html" });
      emailMsg("info", res.emailed ? "Email sent." : "Email not sent (SendGrid not configured).");
    }catch(e){
      emailMsg("warn", e.message);
    }
  });

  run();
})();