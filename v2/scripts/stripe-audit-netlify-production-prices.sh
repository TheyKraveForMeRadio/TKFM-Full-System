#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== TKFM: Stripe LIVE price audit from Netlify production env vars =="
echo "Working dir: $(pwd)"
echo

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found in PATH"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node not found in PATH"
  exit 1
fi

if [ ! -d "node_modules/stripe" ]; then
  echo "NOTE: node_modules/stripe missing. Installing stripe..."
  npm i stripe
fi

node scripts/stripe-audit-netlify-production-prices.mjs
