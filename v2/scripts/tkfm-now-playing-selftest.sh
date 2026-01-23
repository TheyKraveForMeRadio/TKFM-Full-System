#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:9999}"

echo "== TKFM NOW PLAYING SELFTEST =="
echo "Base: $BASE"

echo
echo "[1] GET"
curl -s "$BASE/.netlify/functions/now-playing" | head -c 600; echo

echo
echo "[2] POST (memory update)"
curl -s -X POST "$BASE/.netlify/functions/now-playing" \
  -H "content-type: application/json" \
  -d '{"track_title":"TKFM Live","artist":"DJ KRAVE","dj_tag":"DJ KRAVE","sponsor":"","artwork_url":"","message":"You are tuned in.","is_live":true}' | cat; echo

echo
echo "[3] GET again"
curl -s "$BASE/.netlify/functions/now-playing" | head -c 900; echo

echo "DONE ✅"
