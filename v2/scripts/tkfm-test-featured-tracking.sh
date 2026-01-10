#!/usr/bin/env bash
set -euo pipefail

# TKFM: quick end-to-end test for Featured tracking pipeline
# Requires:
#  - netlify dev running on :8888
#  - owner key set via ./.tkfm_owner_key or env
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-sync-owner-key-to-dotenv.sh
#   netlify dev --port 8888
#   ./scripts/tkfm-test-featured-tracking.sh [id]

ID="${1:-tkfm_test_featured_$(date +%s)}"
BASE="http://localhost:8888"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
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

echo "== FETCH stats (owner raw) =="
STATS_JSON="$(curl -sS -X GET "${BASE}/.netlify/functions/featured-media-stats-admin" \
  -H "x-tkfm-owner-key: ${KEY}" || true)"

echo "${STATS_JSON}" | head -c 5000
echo

echo "== PARSE id from stats (node) =="
ID="${ID}" STATS_JSON="${STATS_JSON}" node - <<'NODE'
const ID = process.env.ID || '';
const raw = process.env.STATS_JSON || '';
let data;
try { data = JSON.parse(raw); } catch (e) { console.log('FAIL: stats not JSON'); process.exit(3); }

if (!data.ok) {
  console.log('FAIL:', data.error || 'stats failed');
  process.exit(4);
}

const stats = data.stats || [];
const hit = stats.find(s => String(s.id||'') === String(ID));
console.log(JSON.stringify(hit || { not_found: ID }, null, 2));
NODE
