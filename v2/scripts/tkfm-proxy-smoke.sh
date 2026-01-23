#!/usr/bin/env bash
set -euo pipefail

VITE_BASE="${1:-http://localhost:5173}"
URL="${VITE_BASE}/.netlify/functions/debug-stripe-env"

echo "== TKFM VITE PROXY SMOKE =="
echo "GET ${URL}"
echo

curl -sS "${URL}" | cat
echo
echo
echo "If the response shows LIVE mode, your checkout buttons on :5173 should work."
echo "If it 404s, restart Vite and confirm vite.config.js proxy is present."
