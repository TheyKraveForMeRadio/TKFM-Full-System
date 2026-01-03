WHAT I’M DOING (NEXT POWER MOVE)
Stop ALL owner-only pages from blinking back to owner-login by standardizing one rule:

NO MORE REDIRECT GATES.
Instead: show an overlay lock (no redirect) + Owner Login button.

This patch adds:
1) scripts/apply-owner-no-redirect-all.sh
   - Auto-patches a list of owner pages (only if the file exists)
   - Injects in <head>:
       <script src="/js/tkfm-owner-guard.js"></script>
       <script src="/js/tkfm-owner-gate-no-redirect.js"></script>
   - Injects near top of <body>:
       <div id="tkfmOwnerLock"></div>
   - Strips redirect-to-owner-login code (window.location / location.replace / href / assign)
   - Removes common external gate scripts (auth-gateway / access-gates) if found
   - Creates timestamped backups in _HOLD/owner-no-redirect-backups/

It does NOT delete your UI. It only removes the redirect loop triggers and adds a lock overlay.

FILES IT TARGETS (if present):
- autopilot-engine.html
- ai-dj-engine.html
- god-view.html
- tkfm-dev-console.html
- owner-ops-dashboard.html
- owner-dashboard.html
- owner-mixtape-orders.html
- owner-login.html (safe-only: no redirect logic removal here; just leaves it)
- label-contract-lab.html (if you treat as owner)
- label-contract-output.html (if you treat as owner)

You can edit the list inside the script anytime.
