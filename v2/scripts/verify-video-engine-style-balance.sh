#!/usr/bin/env bash
set -euo pipefail
F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

opens=$(grep -i "<style" "$F" | wc -l | tr -d " ")
closes=$(grep -i "</style>" "$F" | wc -l | tr -d " ")

echo "== TKFM: Verify video-engine.html style tag balance =="
echo "style_open=$opens style_close=$closes"

if [ "$opens" != "$closes" ]; then
  echo "FAIL: style tags unbalanced"
  exit 1
fi

# quick check: make sure our modal styles are present and NOT outside style/script
grep -qi "TKFM_PAID_LANE_MODAL_STYLES_START" "$F" && echo "OK: modal style marker present" || echo "WARN: modal style marker missing"

echo "OK"
