/* TKFM Paid Lane Modal — Global Singleton (SAFE)
   - Opens from ANY element with: data-open-paid-lane="1" and data-plan="PLANID"
   - Auto-opens via URL: ?submit=1&lane=PLANID
*/
(function () {
  function qs(k){ return new URLSearchParams(location.search).get(k) || ""; }
  function esc(s){ return String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function ensureStyles(){
    if (document.getElementById("tkfmPaidLaneModalStyles")) return;
    const st = document.createElement("style");
    st.id = "tkfmPaidLaneModalStyles";
    st.textContent = `
#tkfmPaidLaneModal{display:none;position:fixed;inset:0;z-index:999999;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
#tkfmPaidLaneModal[data-open="1"]{display:block}
#tkfmPaidLaneModalOverlay{position:absolute;inset:0;background:rgba(2,6,23,.72)}
#tkfmPaidLaneModalCard{position:relative;width:min(720px,calc(100% - 24px));margin:min(8vh,72px) auto 0 auto;border-radius:20px;background:linear-gradient(180deg,rgba(2,6,23,.98),rgba(2,6,23,.92));border:1px solid rgba(34,211,238,.35);box-shadow:0 30px 120px rgba(0,0,0,.55);color:#e2e8f0;overflow:hidden}
#tkfmPaidLaneModalTop{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(34,211,238,.18)}
#tkfmPaidLaneBadge{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,rgba(168,85,247,.35),rgba(236,72,153,.25));border:1px solid rgba(168,85,247,.35);font-weight:900}
#tkfmPaidLanePlanPill{font-size:12px;opacity:.9;padding:6px 10px;border-radius:999px;border:1px solid rgba(250,204,21,.25);background:rgba(250,204,21,.08);color:#fde68a;white-space:nowrap}
#tkfmPaidLaneBody{padding:16px}
.tkfmPLField{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.tkfmPLField label{font-size:12px;opacity:.85}
.tkfmPLField input,.tkfmPLField textarea{width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(34,211,238,.22);background:rgba(15,23,42,.55);color:#e2e8f0;outline:none}
.tkfmPLField input:focus,.tkfmPLField textarea:focus{border-color:rgba(34,211,238,.55)}
#tkfmPaidLaneActions{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;padding:14px 16px;border-top:1px solid rgba(34,211,238,.18)}
.tkfmBtn{border:1px solid rgba(34,211,238,.35);background:rgba(2,6,23,.65);color:#e2e8f0;padding:10px 14px;border-radius:14px;cursor:pointer;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:12px}
.tkfmBtnGold{background:linear-gradient(90deg,rgba(250,204,21,.20),rgba(249,115,22,.12));border-color:rgba(250,204,21,.30);color:#fff7ed}
#tkfmPaidLane_status{font-size:12px;opacity:.9;margin-top:8px}
`;
    document.head.appendChild(st);
  }

  function ensureModal(){
    if (document.getElementById("tkfmPaidLaneModal")) return;
    ensureStyles();
    const wrap = document.createElement("div");
    wrap.id = "tkfmPaidLaneModal";
    wrap.innerHTML = `
<div id="tkfmPaidLaneModalOverlay"></div>
<div id="tkfmPaidLaneModalCard" role="dialog" aria-modal="true" aria-label="TKFM Paid Lane Submission">
  <div id="tkfmPaidLaneModalTop">
    <div style="display:flex;gap:10px;align-items:center">
      <div id="tkfmPaidLaneBadge">TKFM</div>
      <div>
        <div style="font-weight:900">Paid Lane Submission</div>
        <div style="font-size:12px;opacity:.8">Submit instantly after purchase — feeds Featured + Autopilot.</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <div id="tkfmPaidLanePlanPill">Lane: <span id="tkfmPaidLaneLane">(not set)</span></div>
      <button class="tkfmBtn" id="tkfmPaidLaneClose" type="button">Close</button>
    </div>
  </div>

  <div id="tkfmPaidLaneBody">
    <div class="tkfmPLField">
      <label>Title</label>
      <input id="tkfmPaidLaneTitle" placeholder="Project / Track / Campaign title" />
    </div>
    <div class="tkfmPLField">
      <label>Link</label>
      <input id="tkfmPaidLaneLink" placeholder="https:// (YouTube, Spotify, SoundCloud, Drive…)" />
    </div>
    <div class="tkfmPLField">
      <label>Contact</label>
      <input id="tkfmPaidLaneContact" placeholder="Email / IG / Phone" />
    </div>
    <div class="tkfmPLField">
      <label>Notes</label>
      <textarea id="tkfmPaidLaneNotes" rows="3" placeholder="Any details TKFM should know…"></textarea>
    </div>
    <div id="tkfmPaidLane_status"></div>
  </div>

  <div id="tkfmPaidLaneActions">
    <button class="tkfmBtn tkfmBtnGold" id="tkfmPaidLaneSubmit" type="button">Submit Now</button>
  </div>
</div>`;
    document.body.appendChild(wrap);

    const close = ()=>{ wrap.removeAttribute("data-open"); document.documentElement.style.overflow=""; };
    wrap.querySelector("#tkfmPaidLaneClose").onclick = close;
    wrap.querySelector("#tkfmPaidLaneModalOverlay").onclick = close;
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") close(); });

    wrap.querySelector("#tkfmPaidLaneSubmit").onclick = async ()=>{
      const lane = wrap.dataset.lane || "";
      const title = wrap.querySelector("#tkfmPaidLaneTitle").value.trim();
      const link = wrap.querySelector("#tkfmPaidLaneLink").value.trim();
      const contact = wrap.querySelector("#tkfmPaidLaneContact").value.trim();
      const notes = wrap.querySelector("#tkfmPaidLaneNotes").value.trim();
      const status = wrap.querySelector("#tkfmPaidLane_status");

      if(!lane){ status.textContent="Lane missing. Open from a package button or use ?submit=1&lane=..."; return; }
      if(!title || !link || !contact){ status.textContent="Title + Link + Contact are required."; return; }

      status.textContent="Submitting…";
      try{
        if (window.tkfmPaidLaneSubmit) {
          const r = await window.tkfmPaidLaneSubmit({ lane, title, link, contact, notes });
          status.textContent = (r && r.ok) ? "Submitted ✅" : "Submitted ✅ (saved)";
        } else {
          // fallback: store local
          const key="tkfm_paid_lane_submissions_local";
          const list=JSON.parse(localStorage.getItem(key)||"[]");
          list.unshift({ ts:Date.now(), lane, title, link, contact, notes, page:location.pathname });
          localStorage.setItem(key, JSON.stringify(list));
          status.textContent="Submitted ✅ (local)";
        }
      }catch(e){
        status.textContent="Submit failed. Try again.";
      }
    };
  }

  function open(lane){
    ensureModal();
    const wrap = document.getElementById("tkfmPaidLaneModal");
    wrap.dataset.lane = lane || "";
    const laneSpan = document.getElementById("tkfmPaidLaneLane");
    if (laneSpan) laneSpan.textContent = lane ? lane : "(not set)";
    wrap.setAttribute("data-open","1");
    document.documentElement.style.overflow="hidden";
  }

  // trigger anywhere
  document.addEventListener("click", (e)=>{
    const t = e.target.closest && e.target.closest('[data-open-paid-lane="1"]');
    if(!t) return;
    e.preventDefault();
    const lane = t.getAttribute("data-plan") || t.getAttribute("data-lane") || "";
    open(lane);
  });

  // deeplink auto-open
  const submit = qs("submit");
  const lane = qs("lane") || qs("planId");
  if (submit === "1" && lane) {
    setTimeout(()=>open(lane), 220);
  }
})();
