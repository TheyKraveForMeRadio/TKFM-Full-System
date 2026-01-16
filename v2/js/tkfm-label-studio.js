(function(){
  const $ = (id)=>document.getElementById(id);
  const ls = window.localStorage;

  const STATE = {
    customerId: ls.getItem("tkfm_stripe_customer_id") || "",
    credits: 0,
    selectedReqId: ""
  };

  function msg(kind, text){
    const el = $("msg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  function formsMsg(kind, text){
    const el = $("formsMsg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  function vaultMsg(kind, text){
    const el = $("vaultMsg");
    if(!el) return;
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  async function callFn(name, payload, opts){
    if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing.");
    return window.TKFMCallFn(name, payload, opts);
  }

  function setWallet(){
    $("cust").textContent = STATE.customerId ? STATE.customerId : "—";
    $("credits").textContent = String(STATE.credits || 0);
  }

  function esc(s){ return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

  async function refreshCredits(){
    if(!STATE.customerId){ STATE.credits = 0; setWallet(); return; }
    const r = await callFn("studio-credits-get", { customerId: STATE.customerId });
    STATE.credits = r.data.credits || 0;
    setWallet();
  }

  function readProfileUI(){
    return {
      name: ($("p_name")?.value||"").trim(),
      email: ($("p_email")?.value||"").trim(),
      genre: ($("p_genre")?.value||"").trim(),
      ig: ($("p_ig")?.value||"").trim(),
      link: ($("p_link")?.value||"").trim(),
      city: ($("p_city")?.value||"").trim()
    };
  }
  function fillProfileUI(p){
    $("p_name").value = p.name || "";
    $("p_email").value = p.email || "";
    $("p_genre").value = p.genre || "";
    $("p_ig").value = p.ig || "";
    $("p_link").value = p.link || "";
    $("p_city").value = p.city || "";
  }

  async function loadProfile(){
    try{
      if(!STATE.customerId) return msg("warn","Missing customer id. Complete checkout success first.");
      const r = await callFn("studio-profile-get", { customerId: STATE.customerId });
      fillProfileUI(r.data.profile || {});
      msg("info","Profile loaded.");
    }catch(e){ msg("warn", e.message); }
  }

  async function saveProfile(){
    try{
      if(!STATE.customerId) return msg("warn","Missing customer id. Complete checkout success first.");
      const profile = readProfileUI();
      await callFn("studio-profile-save", { customerId: STATE.customerId, profile });
      msg("info","Profile saved.");
    }catch(e){ msg("warn", e.message); }
  }

  function renderUploads(list){
    const ul = $("uploadsList"); if(!ul) return;
    ul.innerHTML = "";
    list = Array.isArray(list) ? list : [];
    if(list.length===0){ ul.innerHTML = `<div class="small">No uploads yet.</div>`; return; }
    for(const u of list.slice(0,10)){
      ul.innerHTML += `<div class="row" style="justify-content:space-between">
        <div class="small">${esc(u.title||u.kind||"Upload")} • <span class="mono">${esc(u.at||"")}</span></div>
        <a class="btn ghost" href="${esc(u.url)}" target="_blank" rel="noreferrer" style="text-decoration:none">Open</a>
      </div>`;
    }
  }

  function renderDeliverables(list){
    const ul = $("deliverablesList"); if(!ul) return;
    ul.innerHTML = "";
    list = Array.isArray(list) ? list : [];
    if(list.length===0){ ul.innerHTML = `<div class="small">No deliverables yet.</div>`; return; }
    for(const d of list.slice(0,10)){
      ul.innerHTML += `<div class="row" style="justify-content:space-between">
        <div class="small"><b>${esc(d.title||"Deliverable")}</b> • <span class="mono">${esc(d.at||"")}</span><br/>${esc(d.note||"")}</div>
        <a class="btn" href="${esc(d.url)}" target="_blank" rel="noreferrer" style="text-decoration:none">Download</a>
      </div>`;
    }
  }

  function selectReq(it){
    STATE.selectedReqId = it.id || "";
    $("vaultReqId").textContent = STATE.selectedReqId || "—";
    $("vaultStatus").textContent = it.status || "—";
    renderUploads(it.uploads||[]);
    renderDeliverables(it.deliverables||[]);
  }

  async function refreshRequests(){
    const tbody = $("myRows"); if(!tbody) return;
    tbody.innerHTML = "";
    if(!STATE.customerId){
      tbody.innerHTML = `<tr><td colspan="6" class="small">No customer id yet.</td></tr>`;
      renderUploads([]); renderDeliverables([]);
      return;
    }
    const r = await callFn("studio-requests-mine", { customerId: STATE.customerId });
    const items = r.data.items || [];
    if(items.length===0){
      tbody.innerHTML = `<tr><td colspan="6" class="small">No Studio requests yet.</td></tr>`;
      renderUploads([]); renderDeliverables([]);
      return;
    }
    for(const it of items){
      const dt = new Date(it.createdAt || it.updatedAt || Date.now());
      const dts = isFinite(dt.getTime()) ? dt.toLocaleString() : "";
      const up = Array.isArray(it.uploads) ? it.uploads.length : 0;
      const dl = Array.isArray(it.deliverables) ? it.deliverables.length : 0;
      tbody.innerHTML += `<tr data-id="${esc(it.id||"")}" style="cursor:pointer">
        <td>${esc(dts)}</td><td>${esc(it.engine||"")}</td><td>${esc(it.status||"new")}</td><td>${esc(String(it.cost||""))}</td>
        <td>${esc(String(up))}</td><td>${esc(String(dl))}</td>
      </tr>`;
    }
    selectReq(items[0]);
  }

  async function buy(lookupKey){
    try{
      msg("info","Creating checkout…");
      const payload = { lookup_key: lookupKey, planId: lookupKey,
        success_url: `${window.location.origin}/label-studio-success.html?planId=${encodeURIComponent(lookupKey)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/label-studio-hub.html`
      };
      const r = await callFn("create-checkout-session", payload);
      const data = r.data || {};
      const url = data.url || data.checkoutUrl || data.checkout_url || data.redirect_url;
      if(!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    }catch(e){ msg("warn", e.message); }
  }

  function openForm(engineId, cost){
    $("formsCard").style.display = "block";
    $("engine").value = engineId;
    $("cost").value = String(cost);
    $("artist").focus();
  }
  function closeForm(){
    $("formsCard").style.display = "none";
    $("formsMsg").style.display = "none";
    $("artist").value = ""; $("notes").value=""; $("links").value="";
    $("engine").value=""; $("cost").value="";
  }

  async function submitReq(){
    const engineId = ($("engine").value||"").trim();
    const cost = Number(($("cost").value||"0").trim());
    if(!STATE.customerId) return formsMsg("warn","Missing customer id.");
    if((STATE.credits||0) < cost) return formsMsg("warn","Insufficient credits.");
    const artist = ($("artist").value||"").trim();
    const notes = ($("notes").value||"").trim();
    const links = ($("links").value||"").trim();
    if(!artist || !notes) return formsMsg("warn","Project and notes required.");
    try{
      formsMsg("info","Using credits + submitting…");
      const use = await callFn("studio-credits-use", { customerId: STATE.customerId, amount: cost });
      STATE.credits = use.data.credits || 0; setWallet();
      const req = await callFn("studio-request-submit", { customerId: STATE.customerId, engine: engineId, cost, artist, notes, links });
      formsMsg("info", `Submitted. Request id: ${req.data.id}`);
      await refreshRequests();
    }catch(e){ formsMsg("warn", e.message); }
  }

  async function addUpload(){
    try{
      if(!STATE.customerId) return vaultMsg("warn","Missing customer id.");
      if(!STATE.selectedReqId) return vaultMsg("warn","Select a request first.");
      const title = ($("uploadTitle").value||"").trim();
      const url = ($("uploadUrl").value||"").trim();
      if(!url) return vaultMsg("warn","Paste an upload link.");
      vaultMsg("info","Saving upload…");
      await callFn("studio-request-add-upload", { customerId: STATE.customerId, id: STATE.selectedReqId, title, url, kind:"upload" });
      $("uploadTitle").value=""; $("uploadUrl").value="";
      await refreshRequests();
      vaultMsg("info","Upload saved.");
    }catch(e){ vaultMsg("warn", e.message); }
  }

  function wire(){
    document.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click", ()=>buy(btn.getAttribute("data-buy"))));
    document.querySelectorAll("[data-open]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const tile = btn.closest(".tile");
        const useBtn = tile ? tile.querySelector("[data-engine]") : null;
        const engine = useBtn ? useBtn.getAttribute("data-engine") : "";
        const cost = useBtn ? Number(useBtn.getAttribute("data-cost")||"0") : 0;
        openForm(engine, cost);
      });
    });
    document.querySelectorAll("[data-engine]").forEach(btn=>btn.addEventListener("click", ()=>openForm(btn.getAttribute("data-engine"), Number(btn.getAttribute("data-cost")||"0"))));
    $("closeForms")?.addEventListener("click", closeForm);
    $("submitReq")?.addEventListener("click", submitReq);
    $("refreshWallet")?.addEventListener("click", async()=>{ msg("info","Refreshing…"); await refreshCredits(); await refreshRequests(); msg("info","Updated."); });
    $("myRows")?.addEventListener("click", async(e)=>{
      const tr = e.target.closest("tr[data-id]"); if(!tr) return;
      const id = tr.getAttribute("data-id");
      const r = await callFn("studio-requests-mine", { customerId: STATE.customerId });
      const it = (r.data.items||[]).find(x=>x && x.id===id);
      if(it) selectReq(it);
    });
    $("addUploadBtn")?.addEventListener("click", addUpload);
    $("saveProfile")?.addEventListener("click", saveProfile);
    $("loadProfile")?.addEventListener("click", loadProfile);
  }

  (async function init(){
    setWallet();
    wire();
    await refreshCredits();
    await refreshRequests();
    if(STATE.customerId) await loadProfile();
    else msg("info","Tip: complete any checkout success to attach your customer id, then save profile.");
  })().catch(e=>msg("warn", e.message));
})();