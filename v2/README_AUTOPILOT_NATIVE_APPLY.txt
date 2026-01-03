WHAT I’M DOING (YOU ASKED ME TO DO IT FOR YOU)
This patch AUTOMATES the “native fix” on:
  originals/autopilot-engine.original.html

It will:
1) Add these scripts in <head> (if missing):
   <script src="/js/tkfm-owner-guard.js"></script>
   <script src="/js/tkfm-owner-gate-no-redirect.js"></script>

2) Add this near top of <body> (if missing):
   <div id="tkfmOwnerLock"></div>

3) Disable / strip any redirect-to-owner-login patterns:
   - window.location / location.href / location.replace / location.assign to owner-login
   - remove external gate scripts like auth-gateway.js / access-gates.js if present

4) OPTIONAL (default ON):
   If your current autopilot-engine.html is the “Stability Wrapper”,
   it will replace autopilot-engine.html with the patched original
   and save the wrapper as:
     originals/autopilot-engine.wrapper.html

Run:
  bash scripts/apply-autopilot-native-fix.sh
