#!/usr/bin/env bash
set -euo pipefail

# TKFM: quick end-to-end test for Featured tracking pipeline
# Requires:
#  - netlify dev running on :8888
#  - TKFM_OWNER_KEY exported in shell
#
# Usage:
#   TKFM_OWNER_KEY=YOUR_OWNER_KEY ./scripts/tkfm-test-featured-tracking.sh [id]
#
# What it does:
#  1) send 1 impression + 1 click for an id
#  2) fetch owner stats and print matching row(s)

ID="${1:-tkfm_test_featured_$(date +%s)}"

if [ -z "${TKFM_OWNER_KEY:-}" ]; then
  echo "FAIL: set TKFM_OWNER_KEY env var"
  exit 2
fi

BASE="http://localhost:8888"

echo "== SEND impression =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-track" \
  -H "Content-Type: application/json" \
  --data "{\"id\":\"${ID}\",\"event\":\"impression\"}" | cat
echo

echo "== SEND click =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-track" \
  -H "Content-Type: application/json" \
  --data "{\"id\":\"${ID}\",\"event\":\"click\"}" | cat
echo

echo "== FETCH stats (owner) =="
curl -sS -X GET "${BASE}/.netlify/functions/featured-media-stats-admin" \
  -H "x-tkfm-owner-key: ${TKFM_OWNER_KEY}" | python - <<'PY'
import sys, json
data = json.load(sys.stdin)
if not data.get("ok"):
  print("FAIL:", data.get("error","stats failed"))
  raise SystemExit(3)

stats = data.get("stats") or []
# print last 20 ids as fallback
print("stats_count:", len(stats))
print("last_5_ids:", [s.get("id") for s in stats[:5]])

PY
echo

echo "== GREP your id =="
curl -sS -X GET "${BASE}/.netlify/functions/featured-media-stats-admin" \
  -H "x-tkfm-owner-key: ${TKFM_OWNER_KEY}" | python - <<PY
import sys, json, os
ID = os.environ.get("ID","")
data = json.load(sys.stdin)
stats = data.get("stats") or []
hit = [s for s in stats if str(s.get("id","")) == ID]
print(json.dumps(hit[0] if hit else {"not_found": ID}, indent=2))
PY
