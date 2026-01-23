#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== TKFM BUILD SMOKE (NO DEPLOY) =="
echo "Project: $ROOT"

echo
echo ">> Build (vite build + postbuild copy)"
npm run build

echo
if [ -f "scripts/tkfm-site-audit.js" ]; then
  echo ">> Site audit"
  node scripts/tkfm-site-audit.js
else
  echo ">> Site audit (skipped: scripts/tkfm-site-audit.js not found)"
fi

echo
if [ -f "scripts/tkfm-price-audit.js" ]; then
  echo ">> Price audit"
  node scripts/tkfm-price-audit.js
else
  echo ">> Price audit (skipped: scripts/tkfm-price-audit.js not found)"
fi

echo
echo ">> Dist sanity"
[ -d dist ] && ls -la dist | head -n 25 || true

echo
echo "✅ BUILD SMOKE: PASS"
