(function(){
  // TKFM Sponsor Read CTA Injector (safe, non-destructive)
  // Adds: floating CTA button + optional hero section block (if target container found)
  const THEME = {
    bg: "#020617",
    purple: "#a855f7",
    pink: "#ec4899",
    cyan: "#22d3ee",
    blue: "#3b82f6"
  };

  const href = "/sponsor-read-engine.html";
  const idBtn = "tkfmSponsorCtaBtn";
  const idStyle = "tkfmSponsorCtaStyle";

  function css(){
    return `
#${idBtn}{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:9999;
  display:flex;
  gap:10px;
  align-items:center;
  padding:12px 14px;
  border-radius:999px;
  text-decoration:none;
  color: rgba(255,255,255,0.92);
  background: linear-gradient(90deg, rgba(168,85,247,0.30), rgba(34,211,238,0.18), rgba(236,72,153,0.16));
  border:1px solid rgba(34,211,238,0.35);
  box-shadow: 0 12px 36px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
#${idBtn}:hover{ transform: translateY(-1px); filter: brightness(1.08); }
#${idBtn} b{ font-size:12px; letter-spacing:0.8px; text-transform:uppercase; }
#${idBtn} span{ font-size:12px; opacity:0.85; }
#${idBtn} .dot{
  width:10px;height:10px;border-radius:999px;
  background: ${THEME.cyan};
  box-shadow: 0 0 18px rgba(34,211,238,0.55);
}
.tkfmSponsorBlock{
  margin: 16px 0;
  border-radius: 18px;
  border: 1px solid rgba(168,85,247,0.28);
  background: linear-gradient(180deg, rgba(2,6,23,0.70), rgba(2,6,23,0.50));
  box-shadow: 0 12px 38px rgba(0,0,0,0.30);
  padding: 16px;
}
.tkfmSponsorBlock .k{
  display:inline-flex;
  gap:8px;
  align-items:center;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(34,211,238,0.26);
  background: rgba(34,211,238,0.08);
  font-size:12px;
  color: rgba(255,255,255,0.82);
}
.tkfmSponsorBlock h3{ margin:10px 0 8px; font-size:20px; color: rgba(255,255,255,0.92); }
.tkfmSponsorBlock p{ margin:0 0 12px; color: rgba(255,255,255,0.70); line-height:1.55; }
.tkfmSponsorBlock .row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.tkfmSponsorBlock .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(250,204,21,0.28);
  background: linear-gradient(90deg, rgba(250,204,21,0.18), rgba(243,115,22,0.14));
  color: rgba(255,255,255,0.92);
  font-weight:800;
  text-decoration:none;
}
.tkfmSponsorBlock .btn.ghost{
  border-color: rgba(34,211,238,0.24);
  background: rgba(2,6,23,0.32);
}
`;
  }

  function ensureStyle(){
    if(document.getElementById(idStyle)) return;
    const s = document.createElement("style");
    s.id = idStyle;
    s.textContent = css();
    document.head.appendChild(s);
  }

  function ensureButton(){
    if(document.getElementById(idBtn)) return;
    const a = document.createElement("a");
    a.id = idBtn;
    a.href = href;
    a.innerHTML = `<div class="dot"></div><div><b>Sponsor Read Engine</b><br/><span>Buy credits → Submit reads</span></div>`;
    document.body.appendChild(a);
  }

  function injectBlock(){
    // Prefer injecting into known containers if present; otherwise do nothing (button already added).
    const candidates = [
      document.querySelector("#tkfmDropsCta"),
      document.querySelector("#tkfmCtas"),
      document.querySelector(".cta-grid"),
      document.querySelector(".cta"),
      document.querySelector("main"),
      document.querySelector(".wrap"),
      document.body
    ].filter(Boolean);

    const host = candidates[0];
    if(!host) return;

    // Avoid duplicate
    if(document.querySelector(".tkfmSponsorBlock")) return;

    const div = document.createElement("div");
    div.className = "tkfmSponsorBlock";
    div.innerHTML = `
      <div class="k">🎙️ Sponsor Reads • Paid Lane • TKFM</div>
      <h3>Get your sponsor read on-air.</h3>
      <p>Purchase a pack (or monthly), then spend credits to submit sponsor read requests. Owner reviews + schedules delivery.</p>
      <div class="row">
        <a class="btn" href="${href}">Open Sponsor Read Engine</a>
        <a class="btn ghost" href="/pricing.html">View Pricing</a>
      </div>
    `;
    // Insert near top of host
    if(host === document.body){
      div.style.margin = "20px";
      host.insertBefore(div, host.firstChild);
    }else{
      host.insertBefore(div, host.firstChild);
    }
  }

  function init(){
    ensureStyle();
    ensureButton();
    injectBlock();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();