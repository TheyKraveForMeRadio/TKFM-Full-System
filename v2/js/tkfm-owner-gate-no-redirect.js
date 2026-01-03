// TKFM Owner Gate (NO REDIRECT)
// Prevents blink loops by showing a locked overlay instead of redirecting.
//
// Use on owner-only pages:
// 1) Include: <script src="/js/tkfm-owner-guard.js"></script>
// 2) Include: <script src="/js/tkfm-owner-gate-no-redirect.js"></script>
// 3) Add: <div id="tkfmOwnerLock"></div> near top of <body>

(function(){
  function isOwner(){
    try{
      return (window.TKFM_OWNER_GUARD && window.TKFM_OWNER_GUARD.isOwnerLocal && window.TKFM_OWNER_GUARD.isOwnerLocal());
    }catch(e){
      return false;
    }
  }

  function overlay(){
    const host = document.getElementById('tkfmOwnerLock');
    if (!host) return;

    if (host.dataset.rendered === '1') return;
    host.dataset.rendered = '1';

    const next = location.pathname.replace(/^\//,'') + location.search + location.hash;
    const loginHref = 'owner-login.html?next=' + encodeURIComponent(next);

    host.innerHTML = `
      <div style="
        position:fixed; inset:0; z-index:99999;
        background:rgba(2,6,23,0.92);
        display:flex; align-items:center; justify-content:center;
        padding:24px;
      ">
        <div style="
          width:min(720px, 100%);
          background:rgba(2,6,23,0.72);
          border:1px solid rgba(148,163,184,0.18);
          border-radius:20px;
          padding:22px;
          color:#fff;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        ">
          <div style="letter-spacing:0.22em; text-transform:uppercase; font-size:11px; color:rgba(226,232,240,0.7)">
            TKFM • Owner Only
          </div>
          <h2 style="margin:10px 0 0 0; font-size:28px; font-weight:900; line-height:1.15">
            Locked
          </h2>
          <p style="margin:10px 0 0 0; color:rgba(226,232,240,0.85); font-size:14px; line-height:1.5">
            This engine is owner-only. Login to unlock. We do <b>not</b> auto-redirect (prevents blink loops).
          </p>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px">
            <a href="${loginHref}" style="
              display:inline-block; padding:10px 14px;
              border-radius:999px; font-weight:900;
              letter-spacing:0.18em; text-transform:uppercase; font-size:11px;
              border:1px solid rgba(236,72,153,0.45);
              background:rgba(236,72,153,0.10);
              color:#ffe4f1;
              text-decoration:none;
            ">Owner Login</a>

            <button id="tkfmClearOwner" style="
              padding:10px 14px;
              border-radius:999px; font-weight:900;
              letter-spacing:0.18em; text-transform:uppercase; font-size:11px;
              border:1px solid rgba(148,163,184,0.35);
              background:rgba(148,163,184,0.10);
              color:#e2e8f0;
              cursor:pointer;
            ">Clear Session</button>
          </div>

          <div style="margin-top:14px; color:rgba(148,163,184,0.8); font-size:12px">
            Next: <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;">${next}</span>
          </div>
        </div>
      </div>
    `;

    const btn = document.getElementById('tkfmClearOwner');
    if (btn){
      btn.addEventListener('click', ()=>{
        try{
          if (window.TKFM_OWNER_GUARD && window.TKFM_OWNER_GUARD.clearOwner) window.TKFM_OWNER_GUARD.clearOwner();
        }catch(e){}
        location.reload();
      });
    }
  }

  function run(){
    if (!isOwner()) overlay();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
