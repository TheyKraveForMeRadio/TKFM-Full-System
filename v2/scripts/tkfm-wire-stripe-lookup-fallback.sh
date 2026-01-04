#!/usr/bin/env bash
set -euo pipefail

# TKFM: Stripe lookup_key fallback (V4 ESM)
# Works with package.json "type":"module"

ROOT="${1:-.}"
cd "$ROOT"

F="netlify/functions/create-checkout-session.js"
[ -f "$F" ] || { echo "SKIP: $F not found"; exit 0; }

node scripts/tkfm-wire-stripe-lookup-fallback.js "$F"
