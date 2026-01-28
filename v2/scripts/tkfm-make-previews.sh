#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM MAKE PREVIEWS =="
rm -rf .tkfm/previews
mkdir -p .tkfm/previews/radio .tkfm/previews/records

echo "== BUILD (base dist) =="
bash scripts/tkfm-build-static-multipage.sh

echo "== RECORDS MODE FILTER =="
export TKFM_SITE_MODE=records
node scripts/tkfm-site-mode-filter.mjs
rm -rf .tkfm/previews/records
mkdir -p .tkfm/previews/records
cp -R dist/* .tkfm/previews/records/

echo "== REBUILD (fresh dist) =="
bash scripts/tkfm-build-static-multipage.sh

echo "== RADIO MODE FILTER =="
export TKFM_SITE_MODE=radio
node scripts/tkfm-site-mode-filter.mjs
rm -rf .tkfm/previews/radio
mkdir -p .tkfm/previews/radio
cp -R dist/* .tkfm/previews/radio/

echo "== PROOF: RECORDS has no RADIO pages =="
ls -1 .tkfm/previews/records | egrep -i '^(owner-live-.*|radio-.*|now-playing|live|podcast.*|podcaster-.*|sponsor-read|sponsor-on-air|sponsor-success|sponsor-cancel|sponsors|ai-drops.*|ai-dj-.*|app-hub|engines|tkfm-catalog)\\.html$' \
  && { echo "BAD: RADIO pages leaked into RECORDS preview"; exit 1; } || echo "OK: RECORDS preview clean"

echo "== PROOF: RADIO has no RECORDS pages =="
ls -1 .tkfm/previews/radio | egrep -i '^(label-.*|label|records-.*|distribution.*|royalty-.*|label-studio-.*|owner-distribution-.*|owner-royalty-.*|they-krave-for-me-mixtapes|mixtape-.*|mixtapes-.*|my-mixtapes|owner-mixtape-.*)\\.html$' \
  && { echo "BAD: RECORDS pages leaked into RADIO preview"; exit 1; } || echo "OK: RADIO preview clean"

echo ""
echo "RUN:"
echo "  python -m http.server 4173 --directory .tkfm/previews/radio"
echo "  python -m http.server 4174 --directory .tkfm/previews/records"
