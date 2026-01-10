#!/usr/bin/env bash
set -euo pipefail

CTX="production"
SCOPE="functions"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: STRIPE_SECRET_KEY is not set in your shell."
  echo "Set it first, then re-run: export STRIPE_SECRET_KEY=sk_live_..."
  exit 1
fi

echo "== TKFM: SET STRIPE_SECRET_KEY for prod + functions =="

# Netlify CLI restriction: can't change context+scope in one set for existing vars.
# So do two updates.
netlify env:set STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" --context "$CTX"
netlify env:set STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" --scope "$SCOPE"

echo "OK: STRIPE_SECRET_KEY updated (prod + functions)"
