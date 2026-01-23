#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:5173}"

echo "== TKFM ALERTS SELFTEST =="
curl -I "$BASE/launch-alerts.html" | head -n 20
curl -I "$BASE/owner-alerts-export.html" | head -n 20
echo "DONE ✅"
