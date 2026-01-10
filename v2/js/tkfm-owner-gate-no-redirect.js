/* TKFM Owner Gate (NO REDIRECT)
   - If not owner authed, shows an overlay lock UI instead of redirecting (prevents blink loops).
   - Page should include: <div id="tkfmOwnerLock"></div> near top of <body>
*/
(function () {
  function get(key) { try { return localStorage.getItem(key); } catch(e) { return null; } }
  function isTrue(v) { return String(v).toLowerCase() === "true" || v === "1"; }

  function authed() {
    const flags = ["tkfm_owner_authed","owner_authed","TKFM_OWNER_AUTH","tkfm_owner_access","tkfm_owner_session"];
    return flags.some(k => isTrue(get(k)));
  }

  function clearSession() {
    const keys = [
      "tkfm_owner_authed","owner_authed","TKFM_OWNER_AUTH","tkfm_owner_access","tkfm_owner_session",
      "tkfm_owner_token","tkfm_owner_key","TKFM_OWNER_KEY",
      "ownerEmail","tkfm_owner_email","tkfm_owner"
    ];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
    location.reload();
  }

  function ensureStyles() {
    if (document.getElementById("tkfmOwnerGateStyles")) return;
    const s = document.createElement("style");
    s.id = "tkfmOwnerGateStyles";
    s.textContent = `
#tkfmOwnerLockWrap{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.82);display:flex;align-items:center;justify-content:center;padding:18px}
#tkfmOwnerLockCard{width:min(640px, calc(100% - 24px));border-radius:22px;background:rgba(2,6,23,.92);border:1px solid rgba(34,211,238,.35);box-shadow:0 30px 120px rgba(0,0,0,.55);color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden}
#tkfmOwnerLockTop{padding:16px 18px;border-bottom:1px solid rgba(34,211,238,.18);display:flex;align-items:center;justify-content:space-between;gap:12px}
#tkfmOwnerLockBadge{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));border:1px solid rgba(168,85,247,.35);font-weight:900}
#tkfmOwnerLockBody{padding:18px}
#tkfmOwnerLockBody p{margin:0;color:rgba(226,232,240,.80);line-height:1.6}
#tkfmOwnerLockActions{padding:16px 18px;border-top:1px solid rgba(34,211,238,.18);display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.tkfmOwnerBtn{border:1px solid rgba(34,211,238,.35);background:rgba(2,6,23,.65);color:#e2e8f0;padding:10px 14px;border-radius:14px;cursor:pointer;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:12px}
.tkfmOwnerBtnHot{background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));border-color:rgba(168,85,247,.35)}
.tkfmOwnerBtnGold{background:linear-gradient(90deg, rgba(250,204,21,.20), rgba(249,115,22,.12));border-color:rgba(250,204,21,.30);color:#fff7ed}
#tkfmOwnerKeyInput{width:100%;margin-top:12px;padding:10px 12px;border-radius:14px;border:1px solid rgba(34,211,238,.22);background:rgba(15,23,42,.55);color:#e2e8f0;outline:none}
#tkfmOwnerKeyInput:focus{border-color:rgba(34,211,238,.55)}
`;
    document.head.appendChild(s);
  }

  function showLock() {
    ensureStyles();
    if (document.getElementById("tkfmOwnerLockWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "tkfmOwnerLockWrap";
    wrap.innerHTML = `
      <div id="tkfmOwnerLockCard" role="dialog" aria-modal="true" aria-label="Owner Locked">
        <div id="tkfmOwnerLockTop">
          <div style="display:flex;gap:10px;align-items:center;">
            <div id="tkfmOwnerLockBadge">TK</div>
            <div>
              <div style="font-weight:900;">Owner Access Required</div>
              <div style="font-size:12px;color:rgba(226,232,240,.70);margin-top:2px;">This page is locked in owner mode.</div>
            </div>
          </div>
          <a href="/owner-login.html" class="tkfmOwnerBtn tkfmOwnerBtnHot" style="text-decoration:none;display:inline-flex;align-items:center;">Owner Login</a>
        </div>
        <div id="tkfmOwnerLockBody">
          <p>Enter your Owner Key to unlock locally (no redirect loops). You can also clear the session if something got stuck.</p>
          <input id="tkfmOwnerKeyInput" placeholder="Paste TKFM_OWNER_KEY here" />
          <div id="tkfmOwnerMsg" style="margin-top:10px;font-size:12px;color:rgba(226,232,240,.75);"></div>
        </div>
        <div id="tkfmOwnerLockActions">
          <button class="tkfmOwnerBtn tkfmOwnerBtnGold" id="tkfmOwnerUnlockBtn" type="button">Unlock</button>
          <button class="tkfmOwnerBtn" id="tkfmOwnerClearBtn" type="button">Clear Session</button>
          <button class="tkfmOwnerBtn" id="tkfmOwnerReloadBtn" type="button">Reload</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const input = wrap.querySelector("#tkfmOwnerKeyInput");
    const msg = wrap.querySelector("#tkfmOwnerMsg");

    wrap.querySelector("#tkfmOwnerReloadBtn").onclick = () => location.reload();
    wrap.querySelector("#tkfmOwnerClearBtn").onclick = () => clearSession();

    wrap.querySelector("#tkfmOwnerUnlockBtn").onclick = () => {
      const k = (input.value || "").trim();
      if (!k) { msg.textContent = "Paste a key first."; return; }
      try {
        localStorage.setItem("TKFM_OWNER_KEY", k);
        localStorage.setItem("tkfm_owner_key", k);
        localStorage.setItem("tkfm_owner_token", k);
        localStorage.setItem("tkfm_owner_authed", "true");
        localStorage.setItem("owner_authed", "true");
        localStorage.setItem("TKFM_OWNER_AUTH", "true");
        localStorage.setItem("tkfm_owner_access", "true");
        localStorage.setItem("tkfm_owner_session", "true");
      } catch(e) {}
      msg.textContent = "Unlocked. Reloading…";
      setTimeout(() => location.reload(), 450);
    };
  }

  if (authed()) return;
  try { if (window.__TKFM_DISABLE_OWNER_GATE === true) return; } catch(e) {}

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showLock);
  else showLock();
})();
