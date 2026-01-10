/* TKFM Paid Lane Owner Inbox
   - owner-only list + approve/reject/feature
*/
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

const OWNER_KEY = (localStorage.getItem("TKFM_OWNER_KEY") || "").trim();

function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function api(path, opts={}){
  const headers = Object.assign({ "accept":"application/json" }, opts.headers||{});
  if (OWNER_KEY) headers["x-tkfm-owner-key"] = OWNER_KEY;
  const res = await fetch(path, Object.assign({}, opts, { headers }));
  const txt = await res.text();
  let j=null;
  try { j = JSON.parse(txt); } catch { j = { ok:false, error: txt }; }
  if (!res.ok) return Object.assign({ ok:false }, j, { status: res.status });
  return j;
}

function row(item){
  const statusPill = item.status === "approved"
    ? `<span class="pill pillOk">APPROVED</span>`
    : item.status === "rejected"
      ? `<span class="pill pillBad">REJECTED</span>`
      : `<span class="pill pillNew">NEW</span>`;

  const featPill = item.featured
    ? `<span class="pill pillGold">FEATURED</span>`
    : `<span class="pill pillSoft">NOT FEATURED</span>`;

  const link = item.link ? `<a class="alink" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">Open Link</a>` : "";
  const contact = item.contact ? `<div class="soft">${escapeHtml(item.contact)}</div>` : `<div class="soft">—</div>`;
  const notes = item.notes ? `<div class="notes">${escapeHtml(item.notes)}</div>` : `<div class="soft">—</div>`;

  return `
  <div class="card">
    <div class="top">
      <div>
        <div class="pill lane">${escapeHtml(item.lane)}</div>
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="meta">
          ${statusPill} ${featPill}
          <span class="soft">• ${escapeHtml(item.createdAt)}</span>
        </div>
      </div>
      <div class="actions">
        ${link}
        <button class="btn" data-act="approve" data-id="${escapeHtml(item.id)}">Approve</button>
        <button class="btn" data-act="reject" data-id="${escapeHtml(item.id)}">Reject</button>
        <button class="btn btnGold" data-act="${item.featured ? "unfeature":"feature"}" data-id="${escapeHtml(item.id)}">${item.featured ? "Remove Featured":"Send to Featured"}</button>
      </div>
    </div>
    <div class="grid">
      <div>
        <div class="label">Contact</div>
        ${contact}
      </div>
      <div>
        <div class="label">Notes</div>
        ${notes}
      </div>
    </div>
  </div>`;
}

async function load(){
  const status = ($("#filterStatus")?.value || "").trim();
  const lane = ($("#filterLane")?.value || "").trim();
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (lane) qs.set("lane", lane);
  if (OWNER_KEY) qs.set("key", OWNER_KEY);

  $("#status").textContent = "Loading…";
  const j = await api(`/.netlify/functions/paid-lane-list?${qs.toString()}`);
  if (!j.ok) {
    $("#status").textContent = j.error || "Failed";
    return;
  }
  const items = j.items || [];
  $("#status").textContent = `Loaded ${items.length} submissions`;
  $("#list").innerHTML = items.map(row).join("") || `<div class="soft">No submissions yet.</div>`;
}

async function act(id, action){
  $("#status").textContent = "Working…";
  const j = await api(`/.netlify/functions/paid-lane-update`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ id, action })
  });
  if (!j.ok) {
    $("#status").textContent = j.error || "Failed";
    return;
  }
  await load();
}

function boot(){
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const id = b.getAttribute("data-id");
    const action = b.getAttribute("data-act");
    act(id, action);
  });
  $("#refresh").addEventListener("click", load);
  $("#filterStatus").addEventListener("change", load);
  $("#filterLane").addEventListener("change", load);
  load();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
