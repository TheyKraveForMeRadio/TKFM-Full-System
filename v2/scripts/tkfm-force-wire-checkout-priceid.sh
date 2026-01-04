#!/usr/bin/env bash
set -euo pipefail

# TKFM: Force-wire priceId resolver inside create-checkout-session.js (CJS-safe)

ROOT="${1:-.}"
cd "$ROOT"

F="netlify/functions/create-checkout-session.js"
[ -f "$F" ] || { echo "SKIP: $F not found"; exit 0; }

node scripts/tkfm-force-wire-checkout-priceid.cjs "$F"
