(function(){
  const $ = (id)=>document.getElementById(id);
  const LS_KEY = "tkfm_owner_key";
  let selectedId = "";
  let selectedCustomer = "";
  let lastToken = "";
  let lastType = "";
  let lastText = "";

  function msg(kind, text){
    const el = $("msg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  function assetMsg(kind, text){
    const el = $("assetMsg");
    el.style.display = "block";
    el.className = "notice" + (kind==="warn" ? " warn" : "");
    el.textContent = text;
  }

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function linkBtn(url, label, ghost){
    const cls = ghost ? "btn ghost" : "btn";
    return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noreferrer" style="text-decoration:none">${esc(label)}</a>`;
  }

  async function callFn(name, payload, ownerKey){
    if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing");
    return window.TKFMCallFn(name, payload, { headers: { "content-type":"application/json", "x-tkfm-owner-key": ownerKey } });
  }

  function setSelectedUI(it){
    selectedId = it.id || "";
    selectedCustomer = it.customerId || "";
    $("selId").textContent = selectedId || "—";
    $("selCus").textContent = selectedCustomer || "—";
    $("status").value = it.status || "new";
    $("scheduledDate").value = it.scheduledDate || "";
    $("ownerNotes").value = it.ownerNotes || "";

    const p = it.profile || {};
    const prof = [
      `<div><b>Name:</b> ${esc(p.name||"")}</div>`,
      `<div><b>Email:</b> ${esc(p.email||"")}</div>`,
      `<div><b>Genre:</b> ${esc(p.genre||"")}</div>`,
      `<div><b>IG:</b> ${esc(p.ig||"")}</div>`,
      `<div><b>Link:</b> ${esc(p.link||"")}</div>`,
      `<div><b>City:</b> ${esc(p.city||"")}</div>`,
    ].join("");
    $("profileBox").innerHTML = prof || "—";

    $("notesBox").textContent = it.notes || "—";
    $("linksBox").textContent = it.links || "—";

    const uploads = Array.isArray(it.uploads) ? it.uploads : [];
    $("uploadsBox").innerHTML = uploads.length ? uploads.slice(0,10).map(u=>{
      const title = u.title || u.kind || "Upload";
      return `<div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div><b>${esc(title)}</b><div class="mono small">${esc(u.at||"")}</div></div>
        ${linkBtn(u.url, "Open", true)}
      </div>`;
    }).join("") : "—";

    const dels = Array.isArray(it.deliverables) ? it.deliverables : [];
    $("deliverablesBox").innerHTML = dels.length ? dels.slice(0,10).map(d=>{
      const title = d.title || "Deliverable";
      const note = d.note || "";
      return `<div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div><b>${esc(title)}</b><div class="mono small">${esc(d.at||"")}</div><div class="small">${esc(note)}</div></div>
        ${linkBtn(d.url, "Download", false)}
      </div>`;
    }).join("") : "—";
  }

  async function loadList(){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    $("ownerKey").value = ownerKey;
    const rows = $("rows");
    rows.innerHTML = "";
    if(!ownerKey){
      msg("warn", "Missing owner key. Paste + Save first.");
      return;
    }
    msg("info", "Loading…");
    const r = await callFn("studio-request-list", {}, ownerKey);
    const items = (r.data.items || []).slice(0, 250);

    if(items.length === 0){
      rows.innerHTML = `<tr><td colspan="7" class="small">No requests.</td></tr>`;
      msg("info", "Loaded 0 requests.");
      return;
    }
    for(const it of items){
      const dt = new Date(it.createdAt || it.updatedAt || Date.now());
      const dts = isFinite(dt.getTime()) ? dt.toLocaleString() : "";
      const up = Array.isArray(it.uploads) ? it.uploads.length : 0;
      const dl = Array.isArray(it.deliverables) ? it.deliverables.length : 0;
      rows.innerHTML += `<tr data-id="${esc(it.id)}" style="cursor:pointer">
        <td>${esc(dts)}</td>
        <td>${esc(it.status||"new")}</td>
        <td>${esc(it.engine||"")}</td>
        <td>${esc(it.artist||"")}</td>
        <td>${esc(String(up))}</td>
        <td>${esc(String(dl))}</td>
        <td class="mono">${esc(it.id||"")}</td>
      </tr>`;
    }
    msg("info", `Loaded ${items.length} requests.`);
    await selectById(items[0].id);
  }

  async function selectById(id){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    if(!ownerKey || !id) return;
    const r = await callFn("studio-request-get", { id }, ownerKey);
    const it = r.data || {};
    if(!it.id) return;
    setSelectedUI(it);
  }

  async function update(){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    if(!ownerKey) return msg("warn","Missing owner key.");
    if(!selectedId) return msg("warn","Select a request first.");
    msg("info","Updating…");
    await callFn("studio-request-update", {
      id: selectedId,
      status: ($("status").value||"").trim(),
      scheduledDate: ($("scheduledDate").value||"").trim(),
      ownerNotes: ($("ownerNotes").value||"").trim()
    }, ownerKey);
    msg("info","Updated.");
    await loadList();
  }

  async function attachDeliverable(){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    if(!ownerKey) return msg("warn","Missing owner key.");
    if(!selectedId) return msg("warn","Select a request first.");
    const title = ($("delTitle").value||"").trim();
    const url = ($("delUrl").value||"").trim();
    const note = ($("delNote").value||"").trim();
    if(!url) return msg("warn","Deliverable URL required.");
    msg("info","Attaching deliverable…");
    await callFn("studio-request-add-deliverable", { id: selectedId, title, url, note, setStatus:"delivered" }, ownerKey);
    $("delTitle").value=""; $("delUrl").value=""; $("delNote").value="";
    msg("info","Deliverable attached + marked delivered.");
    await selectById(selectedId);
    await loadList();
  }

  async function generateAsset(){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    if(!ownerKey) return assetMsg("warn","Missing owner key.");
    if(!selectedId) return assetMsg("warn","Select a request first.");
    const type = ($("assetType").value||"").trim();
    assetMsg("info","Generating…");
    const r = await callFn("studio-request-generate-assets", { id: selectedId, type }, ownerKey);
    const data = r.data || {};
    lastToken = data.token || "";
    lastType = data.type || type;
    lastText = data.text || "";
    $("assetOut").value = lastText || "";
    assetMsg("info", `Generated ${lastType}.`);
  }

  async function copyAsset(){
    const text = ($("assetOut").value||"");
    if(!text) return assetMsg("warn","Nothing to copy.");
    try{
      await navigator.clipboard.writeText(text);
      assetMsg("info","Copied to clipboard.");
    }catch(e){
      assetMsg("warn","Clipboard blocked. Select text and copy manually.");
    }
  }

  async function attachAsset(){
    const ownerKey = (localStorage.getItem(LS_KEY) || "").trim();
    if(!ownerKey) return assetMsg("warn","Missing owner key.");
    if(!selectedId) return assetMsg("warn","Select a request first.");
    if(!lastToken || !lastType) return assetMsg("warn","Generate an asset first.");
    const title = ($("assetTitle").value||"").trim() || lastType.toUpperCase();
    const url = `/.netlify/functions/studio-asset-download?id=${encodeURIComponent(selectedId)}&type=${encodeURIComponent(lastType)}&token=${encodeURIComponent(lastToken)}`;
    assetMsg("info","Attaching asset as deliverable…");
    await callFn("studio-request-add-deliverable", { id: selectedId, title, url, note:"Generated by TKFM Studio Copy Engine", setStatus:"delivered" }, ownerKey);
    assetMsg("info","Attached as deliverable.");
    await selectById(selectedId);
    await loadList();
  }

  function wire(){
    $("saveKey").addEventListener("click", ()=>{
      const v = ($("ownerKey").value||"").trim();
      if(v) localStorage.setItem(LS_KEY, v);
      msg("info","Saved owner key.");
      loadList();
    });
    $("clearKey").addEventListener("click", ()=>{
      localStorage.removeItem(LS_KEY);
      $("ownerKey").value = "";
      msg("info","Cleared.");
    });
    $("refresh").addEventListener("click", loadList);
    $("update").addEventListener("click", update);
    $("attachDeliverable").addEventListener("click", attachDeliverable);

    $("rows").addEventListener("click", async(e)=>{
      const tr = e.target.closest("tr[data-id]");
      if(!tr) return;
      const id = tr.getAttribute("data-id");
      msg("info", `Loading details: ${id}`);
      await selectById(id);
      msg("info", `Selected ${id}`);
    });

    $("generateAsset").addEventListener("click", generateAsset);
    $("copyAsset").addEventListener("click", copyAsset);
    $("attachAsset").addEventListener("click", attachAsset);
  }

  wire();
  loadList().catch(e=>msg("warn", e.message));
})();