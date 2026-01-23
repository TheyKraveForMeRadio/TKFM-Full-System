#!/usr/bin/env bash
set -euo pipefail

# TKFM: Start Netlify Dev with LIVE Stripe key from .env (prevents TEST mismatches)
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

# Load .env into this shell (bash)
set -a
source .env
set +a

# Hard fail if STRIPE_SECRET_KEY is not live
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "Missing STRIPE_SECRET_KEY in .env"
  exit 1
fi

case "$STRIPE_SECRET_KEY" in
  sk_live_*) echo "OK: STRIPE_SECRET_KEY is LIVE";;
  *) echo "STOP: STRIPE_SECRET_KEY is not LIVE in .env"; exit 1;;
esac

echo "Starting netlify dev on 8888 (use http://localhost:8888/ for pages)"
netlify dev --port 8888
