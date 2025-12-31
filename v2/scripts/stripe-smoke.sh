#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:8888/.netlify/functions/create-checkout-session}"

if [ ! -f pricing.html ]; then
  echo "MISSING pricing.html"
  exit 1
fi

PLANS=$(grep -o 'data-plan="[^"]*"' pricing.html | sed 's/data-plan=//g' | tr -d '"' | sort -u)

echo "SMOKE TESTING CHECKOUT URL FOR EACH data-plan"
echo "Endpoint: $URL"
echo

fail=0
for id in $PLANS; do
  resp=$(curl -s -X POST "$URL" -H "content-type: application/json" -d "{\"id\":\"$id\"}")
  if echo "$resp" | grep -q '"url"'; then
    echo "OK   $id"
  else
    echo "FAIL $id  -> $resp"
    fail=1
  fi
done

echo
if [ "$fail" -eq 1 ]; then
  echo "DONE: SOME FAILED (fix missing env vars / missing mappings)"
  exit 2
else
  echo "DONE: ALL PASSED"
fi
