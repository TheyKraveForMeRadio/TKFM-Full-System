#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM SMOKE TEST (local) =="
echo "Assumes: netlify dev --port 8888 is running with LIVE Stripe"
echo

PAGES=(
  "/index.html"
  "/pricing.html"
  "/radio-hub.html"
  "/app-hub.html"
  "/ai-drops-engine.html"
  "/label-studio-hub.html"
  "/label-studio-create-ultimate.html"
  "/label-studio-my-deliverables.html"
  "/podcast-engine.html"
  "/tkfm-catalog.html"
  "/radio-tv.html"
  "/media-directory.html"
)

for p in "${PAGES[@]}"; do
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888${p}")"
  echo "${code}  ${p}"
done

echo
echo "== Functions sanity =="
curl -sS http://localhost:8888/.netlify/functions/debug-stripe-env | tr -d '\r'
echo
