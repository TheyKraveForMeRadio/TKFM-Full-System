#!/usr/bin/env bash
set -euo pipefail

# TKFM: quick end-to-end test for Featured tracking pipeline
# Requires:
#  - netlify dev running on :8888
#  - owner key set via ./.tkfm_owner_key or env
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-test-featured-tracking.sh [id]

ID="${1:-tkfm_test_featured_$(date +%s)}"
BASE="http://localhost:8888"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs)"
if [ -z "${KEY}" ]; then
  echo "FAIL: set owner key first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 2
fi

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
  -H "x-tkfm-owner-key: ${KEY}" | python - <<'PY'
import sys, json
data = json.load(sys.stdin)
if not data.get("ok"):
  print("FAIL:", data.get("error","stats failed"))
  raise SystemExit(3)
stats = data.get("stats") or []
print("stats_count:", len(stats))
print("top_5_ids:", [s.get("id") for s in stats[:5]])
PY
echo

echo "== GREP your id =="
ID="${ID}" KEY="${KEY}" curl -sS -X GET "${BASE}/.netlify/functions/featured-media-stats-admin" \
  -H "x-tkfm-owner-key: ${KEY}" | python - <<PY
import sys, json, os
ID = os.environ.get("ID","")
data = json.load(sys.stdin)
stats = data.get("stats") or []
hit = [s for s in stats if str(s.get("id","")) == ID]
print(json.dumps(hit[0] if hit else {"not_found": ID}, indent=2))
PY
