#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== TKFM FIX: clean invalid function backups + stabilize checkout function =="

mkdir -p backups/netlify-functions

# Move any backup/invalid function files out of netlify/functions
shopt -s nullglob
for f in netlify/functions/*BACKUP* netlify/functions/*.bak* netlify/functions/*.BAK* netlify/functions/*~; do
  if [ -f "$f" ]; then
    echo "Moving backup function out: $f"
    mv -f "$f" "backups/netlify-functions/"
  fi
done
shopt -u nullglob

# Also move any file with multiple dots after .js (Netlify tries to load it as a function)
shopt -s nullglob
for f in netlify/functions/*.js.*; do
  if [ -f "$f" ]; then
    echo "Moving invalid dotted function out: $f"
    mv -f "$f" "backups/netlify-functions/"
  fi
done
shopt -u nullglob

echo "OK: netlify/functions cleaned."

# Quick sanity check: ensure create-checkout-session exports handler
if ! grep -q "export async function handler" netlify/functions/create-checkout-session.js; then
  echo "ERROR: create-checkout-session.js does not export handler."
  exit 1
fi

echo "OK: create-checkout-session.js looks valid."
echo ""
echo "NEXT: run:"
echo "  netlify dev --port 8888"
