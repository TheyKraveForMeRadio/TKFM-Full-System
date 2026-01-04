(() => {
  // TKFM Owner Gate (NO hard redirects)
  // Requires: /js/tkfm-owner-guard.js
  // Behavior:
  //   - If owner key missing, shows a lock panel in #tkfmOwnerLock (if present)
  //   - Does NOT change window.location automatically
  //   - Keeps page usable for non-owner viewing but disables owner actions by hiding buttons tagged data-owner-only="1"

  function $(sel, root=document) { return root.querySelector(sel); }

  function ownerKey() {
    return (window.tkfmOwnerKey && window.tkfmOwnerKey()) || '';
  }

  function isAuthed() {
    return (window.tkfmIsOwnerAuthed && window.tkfmIsOwnerAuthed()) || false;
  }

  function hideOwnerOnly() {
    document.querySelectorAll('[data-owner-only="1"]').forEach((el) => {
      el.style.display = 'none';
    });
  }

  function showLock() {
    const host = $('#tkfmOwnerLock');
    if (!host) return;

    host.innerHTML = `
      <div style="max-width:980px;margin:14px auto 0;padding:14px;border-radius:16px;
                  border:1px solid rgba(236,72,153,.35);
                  background:rgba(236,72,153,.10);
                  color:rgba(255,255,255,.92);
                  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <div style="font-weight:1000;font-size:14px;letter-spacing:.2px;">Owner Locked</div>
        <div style="margin-top:6px;font-size:12px;line-height:1.5;color:rgba(255,255,255,.75);">
          This page is owner-only. Enter your Owner Key to unlock owner tools.
        </div>
        <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <a href="/owner-login.html" style="text-decoration:none;">
            <button type="button" style="cursor:pointer;border:0;border-radius:12px;padding:10px 12px;
                    font-weight:1000;color:#020617;
                    background:linear-gradient(90deg,#a855f7,#ec4899,#22d3ee);">
              Open Owner Login
            </button>
          </a>
          <button id="tkfmOwnerPasteKeyBtn" type="button"
            style="cursor:pointer;border-radius:12px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);
                   background:rgba(255,255,255,.04);color:rgba(255,255,255,.92);font-weight:1000;">
            Paste Owner Key
          </button>
          <span id="tkfmOwnerGateMsg" style="font-size:12px;color:rgba(255,255,255,.75);"></span>
        </div>
      </div>
    `;

    const btn = $('#tkfmOwnerPasteKeyBtn');
    const msg = $('#tkfmOwnerGateMsg');
    if (btn) {
      btn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          const k = String(text || '').trim();
          if (!k) { if (msg) msg.textContent = 'Clipboard empty.'; return; }
          localStorage.setItem('TKFM_OWNER_KEY', k);
          if (msg) msg.textContent = 'Owner key saved. Refreshing…';
          setTimeout(() => location.reload(), 350);
        } catch (_) {
          if (msg) msg.textContent = 'Clipboard blocked. Open Owner Login instead.';
        }
      });
    }
  }

  function boot() {
    if (!window.TKFM_OWNER_GUARD_OK) {
      console.warn('Owner guard missing (js/tkfm-owner-guard.js).');
      showLock();
      hideOwnerOnly();
      return;
    }

    if (!isAuthed()) {
      showLock();
      hideOwnerOnly();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
