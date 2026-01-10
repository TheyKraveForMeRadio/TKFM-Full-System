TKFM OWNER GUARD PUBLIC FIX PATCH

Fixes owner guard errors in BOTH:
- Local Vite dev (serves from /public)
- Netlify deploy (dist includes /js)

Adds/overwrites:
- public/js/tkfm-owner-guard.js   (PRIMARY)
- js/tkfm-owner-guard.js         (BACKUP)
- scripts/tkfm-postbuild-copy-owner-guard.sh
- netlify.toml (same build command; keeps copy step)

APPLY (Git Bash):
  cd ~/Desktop/tkfm_full_production_final_ultra_neon/v2
  unzip -o ~/Downloads/TKFM_OWNER_GUARD_PUBLIC_FIX_PATCH.zip
  chmod +x scripts/tkfm-postbuild-copy-owner-guard.sh
  npm run build || true
  bash scripts/tkfm-postbuild-copy-owner-guard.sh
  ls -la public/js/tkfm-owner-guard.js
  ls -la dist/js/tkfm-owner-guard.js

VERIFY (LIVE):
  curl -sL https://tkfmradio.com/js/tkfm-owner-guard.js | grep -n "TKFM_OWNER_GUARD_OK" || true

COMMIT + PUSH:
  git add public/js/tkfm-owner-guard.js js/tkfm-owner-guard.js scripts/tkfm-postbuild-copy-owner-guard.sh netlify.toml
  git commit -m "Ensure tkfm-owner-guard.js served in dev+prod (public/js + dist/js)" || true
  git push || true
