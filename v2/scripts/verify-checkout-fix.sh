#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== TKFM VERIFY =="
echo "Looking for invalid backup functions in netlify/functions..."
if ls -1 netlify/functions 2>/dev/null | grep -E "BACKUP|\.bak|\.BAK|\.js\." >/dev/null; then
  ls -1 netlify/functions | grep -E "BACKUP|\.bak|\.BAK|\.js\."
  echo "WARNING: still found backup/invalid files"
else
  echo "OK: none found"
fi

echo ""
echo "Confirm create-checkout-session has only ONE planId declaration..."
grep -n "const planId" -n netlify/functions/create-checkout-session.js || true

echo ""
echo "If netlify dev is running, test endpoint:"
echo "curl -s http://localhost:8888/.netlify/functions/create-checkout-session -X POST -H \"content-type: application/json\" -d '{\"planId\":\"video_monthly_visuals\"}' | head"
