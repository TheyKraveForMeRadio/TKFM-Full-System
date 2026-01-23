#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM PRE-DEPLOY SMOKE =="
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pass=true

run() {
  local label="$1"; shift
  echo ""
  echo ">> $label"
  if "$@"; then
    echo "OK"
  else
    echo "FAIL"
    pass=false
  fi
}

if command -v node >/dev/null 2>&1; then
  if [ -f "scripts/tkfm-site-audit.js" ]; then
    run "Site audit" node scripts/tkfm-site-audit.js
  else
    echo "WARN: scripts/tkfm-site-audit.js not found (skipping)"
  fi
  if [ -f "scripts/tkfm-price-audit.js" ]; then
    run "Price audit" node scripts/tkfm-price-audit.js
  else
    echo "WARN: scripts/tkfm-price-audit.js not found (skipping)"
  fi
else
  echo "WARN: node not found (skipping audits)"
fi

if command -v curl >/dev/null 2>&1; then
  # This works only if dev server is running
  echo ""
  echo ">> Stripe env (requires dev server running at 5173)"
  curl -s http://localhost:5173/.netlify/functions/debug-stripe-env | cat || true
else
  echo "WARN: curl not found (skipping)"
fi

echo ""
if [ "$pass" = true ]; then
  echo "✅ PRE-DEPLOY SMOKE: PASS"
  exit 0
else
  echo "❌ PRE-DEPLOY SMOKE: FAIL (see output above)"
  exit 1
fi
