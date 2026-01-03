#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== TKFM: Force LIVE Stripe vars into ALL Netlify contexts =="
echo "Copies production STRIPE_SECRET_KEY and all STRIPE_PRICE_* into dev / deploy-preview / branch-deploy."
echo

LIVE_KEY="$(netlify env:get STRIPE_SECRET_KEY --context production)"
if [[ -z "${LIVE_KEY}" ]]; then
  echo "ERROR: Could not read STRIPE_SECRET_KEY from production context."
  exit 1
fi

echo "Setting STRIPE_SECRET_KEY for dev, deploy-preview, branch-deploy..."
netlify env:set STRIPE_SECRET_KEY "$LIVE_KEY" --context dev
netlify env:set STRIPE_SECRET_KEY "$LIVE_KEY" --context deploy-preview
netlify env:set STRIPE_SECRET_KEY "$LIVE_KEY" --context branch-deploy

echo
echo "Copying all STRIPE_PRICE_* from production into other contexts..."
VARS="$(netlify env:list --context production | awk '{print $1}' | grep '^STRIPE_PRICE_' || true)"
if [[ -z "${VARS}" ]]; then
  echo "WARNING: No STRIPE_PRICE_* vars found in production context via netlify env:list."
else
  for VAR in ${VARS}; do
    VAL="$(netlify env:get "$VAR" --context production)"
    if [[ -n "${VAL}" ]]; then
      netlify env:set "$VAR" "$VAL" --context dev
      netlify env:set "$VAR" "$VAL" --context deploy-preview
      netlify env:set "$VAR" "$VAL" --context branch-deploy
    fi
  done
fi

echo
echo "DONE. Restart netlify dev."
