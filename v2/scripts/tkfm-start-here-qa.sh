#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:5173}"

echo "== TKFM START HERE QA =="
echo "Base: $BASE"

curl -I "$BASE/start-here.html" | head -n 20
curl -I "$BASE/index.html" | head -n 20
curl -I "$BASE/radio-hub.html" | head -n 20

echo "DONE ✅"
