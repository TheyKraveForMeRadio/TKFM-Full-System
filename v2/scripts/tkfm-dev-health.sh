#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:5173}"

echo "== TKFM DEV HEALTH =="
echo "Base: $BASE"
echo

echo "[1/3] Stripe env (via proxy)"
curl -s "$BASE/.netlify/functions/debug-stripe-env" | cat
echo
echo

echo "[2/3] price-info (lookup_key)"
curl -s -X POST "$BASE/.netlify/functions/price-info" \
  -H "content-type: application/json" \
  -d '{"lookup_key":"creator_pass_monthly"}' | cat
echo
echo

echo "[3/3] create-checkout-session (lookup_key)"
curl -s -X POST "$BASE/.netlify/functions/create-checkout-session" \
  -H "content-type: application/json" \
  -d '{"lookup_key":"creator_pass_monthly","success_url":"http://localhost:5173/post-checkout.html","cancel_url":"http://localhost:5173/cancel.html"}' | cat
echo
