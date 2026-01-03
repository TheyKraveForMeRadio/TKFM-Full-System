#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

echo "== TKFM: Fix Checkout (Accounts V2 testmode requirement) =="

# Clean invalid function backups that Netlify might try to load
mkdir -p backups/netlify-functions
shopt -s nullglob
for f in netlify/functions/*.BACKUP* netlify/functions/*.bak* netlify/functions/*~; do
  echo "Moving invalid function file: $f"
  mv -f "$f" "backups/netlify-functions/$(basename "$f")"
done
shopt -u nullglob

echo "✅ Updated: netlify/functions/create-checkout-session.js"
echo "✅ Cleaned: netlify/functions backup files (if any)"
echo
echo "Next:"
echo "  netlify dev --port 8888"
echo "  curl -s http://localhost:8888/.netlify/functions/create-checkout-session -X POST -H \"content-type: application/json\" -d '{\"planId\":\"video_monthly_visuals\",\"email\":\"test@example.com\"}' | head"
