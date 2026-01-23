#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:9999}"

echo "== TKFM DISTRIBUTION V2 SELFTEST =="
echo "[1] submit (manual) — should work"
curl -s -X POST "$BASE/.netlify/functions/distribution-requests-submit" \
  -H "content-type: application/json" \
  -d '{"name":"Test Artist","email":"test@tkfm.local","role":"artist","release_type":"single","project_title":"V2 Test","primary_artist":"Test Artist","genre":"Hip-Hop","release_date":"","tracklist":"01 - Test","asset_urls":["https://example.com/audio.mp3"],"dsp_targets":["spotify"],"addons":["radio_add"],"contract_ack":true}' | cat; echo

echo
echo "[2] list by email — should return items"
curl -s "$BASE/.netlify/functions/distribution-requests-list?email=test@tkfm.local&limit=5" | head -c 700; echo

echo "DONE ✅"
