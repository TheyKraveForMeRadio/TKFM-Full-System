#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:9999}"

echo "== TKFM CHAT SELFTEST =="
echo "Base: $BASE"

echo
echo "[1] list"
curl -s "$BASE/.netlify/functions/station-chat?room=global&limit=3" | head -c 400; echo

echo
echo "[2] send"
curl -s -X POST "$BASE/.netlify/functions/station-chat" \
  -H "content-type: application/json" \
  -d '{"room":"global","display_name":"DJ KRAVE","message":"Chat test ping"}' | cat; echo

echo
echo "[3] list again"
curl -s "$BASE/.netlify/functions/station-chat?room=global&limit=5" | head -c 600; echo

echo "DONE ✅"
