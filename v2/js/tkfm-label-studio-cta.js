(function(){
  const href = "/label-studio-hub.html";
  const idBtn = "tkfmLabelStudioCtaBtn";
  const idStyle = "tkfmLabelStudioCtaStyle";

  function css(){
    return `
#${idBtn}{
  position:fixed; right:18px; bottom:18px; z-index:9999;
  display:flex; gap:10px; align-items:center;
  padding:12px 14px; border-radius:999px; text-decoration:none;
  color: rgba(255,255,255,0.92);
  background: linear-gradient(90deg, rgba(250,204,21,0.20), rgba(243,115,22,0.14), rgba(168,85,247,0.10));
  border:1px solid rgba(250,204,21,0.35);
  box-shadow: 0 12px 36px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
#${idBtn}:hover{ transform: translateY(-1px); filter: brightness(1.08); }
#${idBtn} b{ font-size:12px; letter-spacing:0.8px; text-transform:uppercase; }
#${idBtn} span{ font-size:12px; opacity:0.85; }
#${idBtn} .dot{ width:10px;height:10px;border-radius:999px; background:#facc15; box-shadow:0 0 18px rgba(250,204,21,0.55); }

.tkfmStudioBlock{
  margin: 16px 0;
  border-radius: 18px;
  border: 1px solid rgba(250,204,21,0.22);
  background: linear-gradient(180deg, rgba(2,6,23,0.70), rgba(2,6,23,0.50));
  box-shadow: 0 12px 38px rgba(0,0,0,0.30);
  padding: 16px;
}
.tkfmStudioBlock .k{
  display:inline-flex; gap:8px; align-items:center;
  padding:6px 10px; border-radius:999px;
  border:1px solid rgba(250,204,21,0.22);
  background: rgba(250,204,21,0.08);
  font-size:12px; color: rgba(255,255,255,0.82);
}
.tkfmStudioBlock h3{ margin:10px 0 8px; font-size:20px; color: rgba(255,255,255,0.92); }
.tkfmStudioBlock p{ margin:0 0 12px; color: rgba(255,255,255,0.70); line-height:1.55; }
.tkfmStudioBlock .row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.tkfmStudioBlock .btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:10px 12px; border-radius: 12px;
  border: 1px solid rgba(250,204,21,0.28);
  background: linear-gradient(90deg, rgba(250,204,21,0.18), rgba(243,115,22,0.14));
  color: rgba(255,255,255,0.92);
  font-weight:800; text-decoration:none;
}
.tkfmStudioBlock .btn.ghost{ border-color: rgba(168,85,247,0.24); background: rgba(2,6,23,0.32); }
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
    a.innerHTML = `<div class="dot"></div><div><b>Label Studio Hub</b><br/><span>Credits → Mix • Visuals • Release</span></div>`;
    document.body.appendChild(a);
  }

  function injectBlock(){
    const host = document.querySelector("#tkfmStudioCta") || document.querySelector("#tkfmCtas") || document.querySelector(".wrap") || document.querySelector("main");
    if(!host) return;
    if(document.querySelector(".tkfmStudioBlock")) return;
    const div = document.createElement("div");
    div.className = "tkfmStudioBlock";
    div.innerHTML = `
      <div class="k">🏛 TKFM Records • Label Studio</div>
      <h3>Built‑In Studio workflow for artists & producers.</h3>
      <p>Buy credits, run engines (Mix Polish, Stem Split, Visual Pack, EPK, Launch), then submit to the label queue.</p>
      <div class="row">
        <a class="btn" href="${href}">Open Label Studio Hub</a>
        <a class="btn ghost" href="/label-home.html">Label Home</a>
      </div>
    `;
    host.insertBefore(div, host.firstChild);
  }

  function init(){
    ensureStyle(); ensureButton(); injectBlock();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();