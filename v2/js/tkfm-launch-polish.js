// TKFM Launch Polish (V3) — Onboarding strip + Trust Bar + Post-Checkout Help + Pro Footer + Sticky Help Button
// Radio Neon: #020617 #a855f7 #ec4899 #22d3ee #3b82f6
// Records Gold: #020617 #facc15 #eab308 #f97316
(function () {
  if (window.__TKFM_LAUNCH_POLISH_LOADED_V3) return;
  window.__TKFM_LAUNCH_POLISH_LOADED_V3 = true;

  const CSS_ID = "tkfmLaunchPolishCss";
  const STRIP_ID = "tkfmLaunchPolishStrip";
  const TRUST_ID = "tkfmLaunchPolishTrust";
  const FOOTER_ID = "tkfmLaunchPolishFooter";
  const POST_ID = "tkfmPostCheckoutHelp";
  const HELP_BTN_ID = "tkfmStickyHelpBtn";
  const HELP_PANEL_ID = "tkfmStickyHelpPanel";

  function el(tag, attrs, html) {
    const n = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function shouldOptOut() {
    const meta = document.querySelector('meta[name="tkfm-polish"]');
    if (meta && String(meta.getAttribute("content") || "").toLowerCase() === "off") return true;
    if (document.body && (document.body.getAttribute("data-tkfm-polish") || "").toLowerCase() === "off") return true;
    return false;
  }

  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    const style = el("style", { id: CSS_ID });
    style.textContent = `
:root{
  --tkfm-bg:#020617;
  --tkfm-neon1:#22d3ee; --tkfm-neon2:#a855f7; --tkfm-neon3:#ec4899;
  --tkfm-slate:#0f172a;
  --tkfm-text:#e2e8f0; --tkfm-muted:#94a3b8;
  --tkfm-border:rgba(148,163,184,.18);
}
#${STRIP_ID}{
  margin:14px auto 0 auto; max-width:1100px;
  border-radius:18px;
  background:rgba(2,6,23,.78);
  border:1px solid rgba(168,85,247,.30);
  box-shadow:0 0 0 1px rgba(34,211,238,.10),0 16px 50px rgba(0,0,0,.50);
  padding:14px 16px;
}
#${STRIP_ID} .tkfmRow{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}
#${STRIP_ID} .tkfmTitle{font-weight:950;letter-spacing:.4px;color:var(--tkfm-text);font-size:16px}
#${STRIP_ID} .tkfmSub{margin-top:4px;color:var(--tkfm-muted);font-size:12px;line-height:1.35}
#${STRIP_ID} .tkfmSteps{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#${STRIP_ID} .tkfmChip{
  display:inline-flex;gap:6px;align-items:center;
  padding:8px 10px;border-radius:999px;
  border:1px solid var(--tkfm-border);
  background:rgba(15,23,42,.55);
  color:var(--tkfm-text);
  font-size:12px;font-weight:850;
}
#${STRIP_ID} .tkfmDot{
  width:7px;height:7px;border-radius:999px;
  background:linear-gradient(90deg,var(--tkfm-neon1),var(--tkfm-neon2),var(--tkfm-neon3));
  box-shadow:0 0 18px rgba(34,211,238,.25);
}
#${STRIP_ID} .tkfmBtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#${STRIP_ID} .tkfmBtn{
  text-decoration:none;
  display:inline-flex;align-items:center;justify-content:center;
  padding:9px 12px;border-radius:999px;
  font-weight:950;font-size:12px;
  color:var(--tkfm-bg);
  background:linear-gradient(90deg,var(--tkfm-neon1),var(--tkfm-neon2),var(--tkfm-neon3));
  box-shadow:0 14px 30px rgba(0,0,0,.35);
}
#${STRIP_ID} .tkfmBtnAlt{
  text-decoration:none;
  display:inline-flex;align-items:center;justify-content:center;
  padding:9px 12px;border-radius:999px;
  font-weight:900;font-size:12px;
  color:var(--tkfm-text);
  border:1px solid var(--tkfm-border);
  background:rgba(15,23,42,.55);
}
#${TRUST_ID}{
  margin:10px auto 0 auto; max-width:1100px;
  border-radius:18px;
  background:rgba(15,23,42,.55);
  border:1px solid var(--tkfm-border);
  padding:12px 14px;
}
#${TRUST_ID} .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
#${TRUST_ID} .item{border-radius:14px;border:1px solid rgba(168,85,247,.18);background:rgba(2,6,23,.45);padding:10px 12px}
#${TRUST_ID} .k{font-size:11px;letter-spacing:.45px;text-transform:uppercase;color:var(--tkfm-muted);font-weight:900}
#${TRUST_ID} .v{margin-top:6px;color:var(--tkfm-text);font-size:13px;font-weight:950;line-height:1.2}
#${TRUST_ID} .s{margin-top:6px;color:var(--tkfm-muted);font-size:12px;line-height:1.35}
#${POST_ID}{
  margin:12px auto 0 auto; max-width:1100px;
  border-radius:18px;
  background:rgba(2,6,23,.78);
  border:1px solid rgba(250,204,21,.22);
  box-shadow:0 0 0 1px rgba(250,204,21,.08),0 16px 50px rgba(0,0,0,.50);
  padding:14px 16px;
}
#${POST_ID} .h{font-weight:950;font-size:16px;letter-spacing:.35px}
#${POST_ID} .p{margin-top:6px;color:var(--tkfm-muted);font-size:12px;line-height:1.45}
#${POST_ID} .btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#${POST_ID} a{
  text-decoration:none;
  display:inline-flex;align-items:center;justify-content:center;
  padding:9px 12px;border-radius:999px;
  font-weight:950;font-size:12px;
  border:1px solid var(--tkfm-border);
  background:rgba(15,23,42,.55);
  color:var(--tkfm-text);
}
#${POST_ID} a.primary{
  color:var(--tkfm-bg);
  border-color:transparent;
  background:linear-gradient(90deg,var(--tkfm-neon1),var(--tkfm-neon2),var(--tkfm-neon3));
}
#${FOOTER_ID}{
  margin:18px 0 0 0;
  padding:18px 0;
  border-top:1px solid var(--tkfm-border);
  background:rgba(2,6,23,.92);
}
#${FOOTER_ID} .wrap{max-width:1100px;margin:0 auto;padding:0 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between}
#${FOOTER_ID} .links{display:flex;gap:10px;flex-wrap:wrap}
#${FOOTER_ID} a{
  color:var(--tkfm-text);
  text-decoration:none;
  padding:8px 10px;border-radius:999px;
  border:1px solid var(--tkfm-border);
  background:rgba(15,23,42,.55);
  font-weight:850;font-size:12px;
}
#${FOOTER_ID} a:hover{border-color:rgba(34,211,238,.35)}
#${FOOTER_ID} .copy{color:var(--tkfm-muted);font-size:12px;font-weight:800}

/* Sticky Help */
#${HELP_BTN_ID}{
  position:fixed;right:16px;bottom:16px;z-index:9999;
  display:inline-flex;align-items:center;justify-content:center;
  width:54px;height:54px;border-radius:999px;
  border:1px solid rgba(34,211,238,.25);
  background:rgba(2,6,23,.70);
  box-shadow:0 18px 45px rgba(0,0,0,.55),0 0 0 1px rgba(168,85,247,.10);
  cursor:pointer;
}
#${HELP_BTN_ID} .ring{
  position:absolute;inset:-2px;border-radius:999px;
  background:linear-gradient(90deg,var(--tkfm-neon1),var(--tkfm-neon2),var(--tkfm-neon3));
  filter:blur(0px);
  opacity:.85;
}
#${HELP_BTN_ID} .icon{
  position:relative;z-index:2;
  width:44px;height:44px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(2,6,23,.92);
  color:var(--tkfm-text);
  font-weight:950;font-size:18px;
  border:1px solid rgba(148,163,184,.16);
}
#${HELP_PANEL_ID}{
  position:fixed;right:16px;bottom:80px;z-index:9999;
  width:min(360px, calc(100vw - 32px));
  border-radius:18px;
  background:rgba(2,6,23,.94);
  border:1px solid rgba(148,163,184,.18);
  box-shadow:0 24px 70px rgba(0,0,0,.65);
  overflow:hidden;
  display:none;
}
#${HELP_PANEL_ID}.on{display:block}
#${HELP_PANEL_ID} .hd{
  padding:12px 14px;
  border-bottom:1px solid rgba(148,163,184,.14);
  display:flex;align-items:center;justify-content:space-between;gap:10px;
}
#${HELP_PANEL_ID} .ttl{font-weight:950;letter-spacing:.35px}
#${HELP_PANEL_ID} .x{
  border:none;background:transparent;color:var(--tkfm-muted);
  font-weight:950;font-size:18px;cursor:pointer;
}
#${HELP_PANEL_ID} .bd{padding:12px 14px}
#${HELP_PANEL_ID} .desc{color:var(--tkfm-muted);font-size:12px;line-height:1.45;margin-bottom:10px}
#${HELP_PANEL_ID} .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#${HELP_PANEL_ID} a{
  text-decoration:none;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:10px 12px;border-radius:14px;
  border:1px solid rgba(148,163,184,.18);
  background:rgba(15,23,42,.55);
  color:var(--tkfm-text);
  font-weight:900;font-size:12px;
}
#${HELP_PANEL_ID} a.primary{
  grid-column:1 / -1;
  color:var(--tkfm-bg);
  border-color:transparent;
  background:linear-gradient(90deg,var(--tkfm-neon1),var(--tkfm-neon2),var(--tkfm-neon3));
}
    `.trim();
    document.head.appendChild(style);
  }

  function injectStrip() {
    if (document.getElementById(STRIP_ID)) return;

    const host = document.querySelector("main") || document.body;

    const strip = el("section", { id: STRIP_ID, role: "region", "aria-label": "TKFM Start Here" });
    strip.innerHTML = `
  <div class="tkfmRow">
    <div style="min-width:240px">
      <div class="tkfmTitle">Start Here — Buy → Post‑Checkout → Submit → My Portal</div>
      <div class="tkfmSub">Every engine is built to convert: purchase unlocks your lane, then you submit and track everything in your Portal.</div>
    </div>
    <div class="tkfmSteps" aria-label="Workflow steps">
      <span class="tkfmChip"><span class="tkfmDot"></span>Buy</span>
      <span class="tkfmChip"><span class="tkfmDot"></span>Post‑Checkout</span>
      <span class="tkfmChip"><span class="tkfmDot"></span>Submit</span>
      <span class="tkfmChip"><span class="tkfmDot"></span>My Portal</span>
    </div>
  </div>
  <div class="tkfmBtns" aria-label="Quick actions">
    <a class="tkfmBtn" href="/tkfm-sitemap.html">All Pages</a>
    <a class="tkfmBtnAlt" href="/pricing.html">Pricing</a>
    <a class="tkfmBtnAlt" href="/client-vault.html">My Portal</a>
    <a class="tkfmBtnAlt" href="/support.html">Support</a>
    <a class="tkfmBtnAlt" href="/status.html">Status</a>
  </div>
    `.trim();

    try {
      if (host.firstChild) host.insertBefore(strip, host.firstChild);
      else host.appendChild(strip);
    } catch {
      document.body.insertBefore(strip, document.body.firstChild);
    }
  }

  function injectTrustBar() {
    if (document.getElementById(TRUST_ID)) return;

    const p = (location.pathname || "").toLowerCase();
    const isSales =
      p === "/" ||
      p.endsWith("/index.html") ||
      p.includes("pricing") ||
      p.includes("radio-hub") ||
      p.includes("ai-drops") ||
      p.includes("sponsor") ||
      p.includes("label") ||
      p.includes("mixtape") ||
      p.includes("podcast") ||
      p.includes("feature") ||
      p.includes("social");

    if (!isSales && !document.getElementById(STRIP_ID)) return;

    const host = document.querySelector("main") || document.body;
    const trust = el("section", { id: TRUST_ID, role: "region", "aria-label": "Trust and delivery" });
    trust.innerHTML = `
  <div class="row">
    <div class="item">
      <div class="k">Payments</div>
      <div class="v">Secure Stripe Checkout</div>
      <div class="s">Fast, verified payments with instant access unlocks.</div>
    </div>
    <div class="item">
      <div class="k">Unlocks</div>
      <div class="v">Instant Lane Access</div>
      <div class="s">Purchase turns on your feature lane immediately.</div>
    </div>
    <div class="item">
      <div class="k">Workflow</div>
      <div class="v">Submit + Track Deliverables</div>
      <div class="s">Your portal keeps receipts, requests, and deliverables.</div>
    </div>
    <div class="item">
      <div class="k">Support</div>
      <div class="v">Help When You Need It</div>
      <div class="s"><a href="/support.html" style="text-decoration:underline;color:inherit">support.html</a> + clear next steps.</div>
    </div>
  </div>
    `.trim();

    const strip = document.getElementById(STRIP_ID);
    if (strip && strip.parentNode) strip.parentNode.insertBefore(trust, strip.nextSibling);
    else {
      if (host.firstChild) host.insertBefore(trust, host.firstChild);
      else host.appendChild(trust);
    }
  }

  function injectPostCheckoutHelp() {
    if (document.getElementById(POST_ID)) return;

    const p = (location.pathname || "").toLowerCase();
    const isPost =
      p.includes("success") ||
      p.includes("cancel") ||
      p.includes("post-checkout") ||
      p.includes("rotation-boost-success") ||
      p.includes("sponsor-success") ||
      p.includes("sponsor-cancel") ||
      p.includes("mixtapes-success");

    if (!isPost) return;

    const host = document.querySelector("main") || document.body;

    const box = el("section", { id: POST_ID, role: "region", "aria-label": "Next steps" });
    box.innerHTML = `
  <div class="h">Next Steps</div>
  <div class="p">Your purchase unlocks your lane. Submit your request, track progress in your Portal, or get help fast.</div>
  <div class="btns">
    <a class="primary" href="/client-vault.html">Open My Portal</a>
    <a href="/submit.html">Submit</a>
    <a href="/tkfm-sitemap.html">All Pages</a>
    <a href="/support.html">Support</a>
    <a href="/terms.html">Terms</a>
    <a href="/privacy.html">Privacy</a>
  </div>
    `.trim();

    try {
      if (host.firstChild) host.insertBefore(box, host.firstChild);
      else host.appendChild(box);
    } catch {
      document.body.insertBefore(box, document.body.firstChild);
    }
  }

  function injectFooter() {
    if (document.getElementById(FOOTER_ID)) return;
    const f = el("footer", { id: FOOTER_ID });
    const year = new Date().getFullYear();
    f.innerHTML = `
  <div class="wrap">
    <div class="copy">© ${year} They Krave For Me Radio (TKFM) • Independent Artist Power Station</div>
    <div class="links" aria-label="Footer links">
      <a href="/radio-hub.html">Radio Hub</a>
      <a href="/app-hub.html">Engines</a>
      <a href="/tkfm-catalog.html">Catalog</a>
      <a href="/tkfm-sitemap.html">Site Map</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/support.html">Support</a>
      <a href="/terms.html">Terms</a>
      <a href="/privacy.html">Privacy</a>
      <a href="/status.html">Status</a>
    </div>
  </div>
    `.trim();
    document.body.appendChild(f);
  }

  function injectStickyHelp() {
    if (document.getElementById(HELP_BTN_ID)) return;

    const btn = el("button", { id: HELP_BTN_ID, type: "button", "aria-label": "Help" });
    btn.innerHTML = `<span class="ring" aria-hidden="true"></span><span class="icon">?</span>`;

    const panel = el("div", { id: HELP_PANEL_ID, role: "dialog", "aria-label": "Help panel" });
    panel.innerHTML = `
  <div class="hd">
    <div class="ttl">Need help?</div>
    <button class="x" type="button" aria-label="Close">×</button>
  </div>
  <div class="bd">
    <div class="desc">Fast links to support, your portal, and the full sitemap.</div>
    <a class="primary" href="/client-vault.html">Open My Portal <span>→</span></a>
    <div class="grid">
      <a href="/support.html">Support <span>→</span></a>
      <a href="/tkfm-sitemap.html">All Pages <span>→</span></a>
      <a href="/pricing.html">Pricing <span>→</span></a>
      <a href="/status.html">Status <span>→</span></a>
    </div>
  </div>
    `.trim();

    const closeBtn = panel.querySelector(".x");

    function close() { panel.classList.remove("on"); }
    function toggle() { panel.classList.toggle("on"); }
    function clickOutside(e) {
      if (!panel.classList.contains("on")) return;
      if (e.target === btn) return;
      if (panel.contains(e.target)) return;
      close();
    }

    btn.addEventListener("click", toggle);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("click", clickOutside);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  function run() {
    if (shouldOptOut()) return;
    ensureCss();
    injectStrip();
    injectTrustBar();
    injectPostCheckoutHelp();
    injectFooter();
    injectStickyHelp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
